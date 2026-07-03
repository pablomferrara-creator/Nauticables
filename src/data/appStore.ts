import { useEffect, useMemo, useRef, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import type {
  CashCurrency,
  CashMovementType,
  OrderStatus,
  ProductKind,
  UserRole,
} from "../domain/models";
import { WORKSPACE_DOC_PATH, db } from "../firebase/config";

const STORAGE_KEY = "nauticables-local-prototype-v3";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  active: boolean;
}

export interface AppShipyard {
  id: string;
  name: string;
  zone: string;
  contactName: string;
  phone: string;
  notes: string;
}

export interface AppProduct {
  id: string;
  code: string;
  name: string;
  kind: ProductKind;
  salePriceArs: number;
  family: string;
  recipeSummary: string[];
  laborHours: number;
  laborHourlyRateArs: number;
  targetMarginPercent: number;
  recipeItems: AppRecipeItem[];
}

export interface AppRecipeItem {
  id: string;
  name: string;
  supplier: string;
  unit: string;
  quantity: number;
  unitCostArs: number;
}

export interface AppMaterial {
  id: string;
  name: string;
  unit: string;
  supplier: string;
  category: string;
  currency: CashCurrency;
  currentCost: number;
  previousCosts: number[];
  notes: string;
}

export interface AppOrderItem {
  id: string;
  productId: string;
  quantityOrdered: number;
  quantityProduced: number;
  quantityDelivered: number;
}

export interface AppProductionEntry {
  id: string;
  orderItemId: string;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
  quantity: number;
  note: string;
}

export interface AppDeliveryEntry {
  id: string;
  orderItemId: string;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
  quantity: number;
  note: string;
}

export interface AppOrder {
  id: string;
  shipyardId: string;
  orderedAt: string;
  deliveryDueAt: string;
  status: OrderStatus;
  customerNotes: string;
  internalNotes: string;
  createdByUserId: string;
  items: AppOrderItem[];
  productionEntries: AppProductionEntry[];
  deliveryEntries: AppDeliveryEntry[];
}

export interface AppCashAccount {
  id: string;
  name: string;
  currency: CashCurrency;
}

export interface AppCashMovement {
  id: string;
  cashAccountId: string;
  movementDate: string;
  type: CashMovementType;
  category: string;
  concept: string;
  amount: number;
  currency: CashCurrency;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
  linkedEntityType?: "receivable" | "payable" | "wage_batch" | "order";
  linkedEntityId?: string;
}

export interface AppReceivable {
  id: string;
  shipyardId: string;
  concept: string;
  originDate: string;
  dueDate: string;
  currency: CashCurrency;
  totalAmount: number;
  collectedAmount: number;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
}

export interface AppPayable {
  id: string;
  supplierName: string;
  concept: string;
  originDate: string;
  dueDate: string;
  currency: CashCurrency;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
}

export interface AppState {
  users: AppUser[];
  shipyards: AppShipyard[];
  materials: AppMaterial[];
  products: AppProduct[];
  orders: AppOrder[];
  cashAccounts: AppCashAccount[];
  cashMovements: AppCashMovement[];
  receivables: AppReceivable[];
  payables: AppPayable[];
}

type SharedAppState = AppState;

export interface CreateOrderInput {
  shipyardId: string;
  orderedAt: string;
  deliveryDueAt: string;
  customerNotes: string;
  internalNotes: string;
  items: Array<{
    productId: string;
    quantityOrdered: number;
  }>;
}

export interface ProductionInput {
  orderId: string;
  orderItemId: string;
  quantity: number;
  note: string;
}

export interface DeliveryInput {
  orderId: string;
  orderItemId: string;
  quantity: number;
  note: string;
}

export interface CreateCashMovementInput {
  cashAccountId: string;
  movementDate: string;
  type: CashMovementType;
  category: string;
  concept: string;
  amount: number;
}

export interface CreateReceivableInput {
  shipyardId: string;
  concept: string;
  originDate: string;
  dueDate: string;
  currency: CashCurrency;
  totalAmount: number;
}

export interface CreatePayableInput {
  supplierName: string;
  concept: string;
  originDate: string;
  dueDate: string;
  currency: CashCurrency;
  totalAmount: number;
}

export interface SettleReceivableInput {
  receivableId: string;
  amount: number;
}

export interface SettlePayableInput {
  payableId: string;
  amount: number;
}

export interface UpdateUserAccessInput {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface UpdateProductCostingInput {
  productId: string;
  laborHours: number;
  laborHourlyRateArs: number;
  targetMarginPercent: number;
  salePriceArs: number;
}

const seedState: AppState = {
  users: [
    {
      id: "u-admin-pablo",
      name: "Pablo",
      role: "admin",
      email: "pablomferrara@gmail.com",
      active: true,
    },
    {
      id: "u-admin-socio",
      name: "Socio",
      role: "admin",
      email: "",
      active: true,
    },
    {
      id: "u-operador-1",
      name: "Operador taller",
      role: "operador",
      email: "",
      active: true,
    },
  ],
  shipyards: [
    {
      id: "sy-klase",
      name: "Klase A",
      zone: "San Fernando",
      contactName: "Nicolas",
      phone: "11 5292 5910",
      notes: "Cliente activo, suele pedir entregas parciales.",
    },
    {
      id: "sy-vision",
      name: "Vision",
      zone: "Rio Lujan",
      contactName: "Alejandro Gallesio",
      phone: "11 2258 8881",
      notes: "Consolidado. Modelos V180 y V150 frecuentes.",
    },
    {
      id: "sy-canestrari",
      name: "Canestrari",
      zone: "Zona norte",
      contactName: "Oscar",
      phone: "11 4083 3530",
      notes: "Pedido semanal variable, a veces cobra y retira el mismo viaje.",
    },
    {
      id: "sy-silver",
      name: "Silver Boat",
      zone: "Tigre",
      contactName: "Nicolas",
      phone: "11 4029 6526",
      notes: "Buen candidato para comparar por temporada.",
    },
  ],
  materials: [
    {
      id: "mat-relay-ku35n-12v-50a",
      name: "relay ku-35n 12v 50a",
      unit: "unidad",
      supplier: "Autopartes Pilar",
      category: "Electricos",
      currency: "ARS",
      currentCost: 1600,
      previousCosts: [700, 390, 220, 190],
      notes: "",
    },
    {
      id: "mat-fusilera-6-fusibles-genrod",
      name: "fusilera (6 fusibles) genrod",
      unit: "unidad",
      supplier: "Janored",
      category: "Proteccion",
      currency: "ARS",
      currentCost: 8177.76,
      previousCosts: [7939.57, 7708.32, 7263.94, 6922.44],
      notes: "",
    },
    {
      id: "mat-fusibles-10a",
      name: "Fusibles 10A",
      unit: "unidad",
      supplier: "Janored",
      category: "Proteccion",
      currency: "ARS",
      currentCost: 142,
      previousCosts: [138, 129.92, 119.04, 112.25],
      notes: "",
    },
    {
      id: "mat-bornera-keland-t2-60",
      name: "bornera keland t2-60 (60a 500v)",
      unit: "unidad",
      supplier: "Janored",
      category: "Electricos",
      currency: "ARS",
      currentCost: 3945.16,
      previousCosts: [3817.9, 3553, 3054.32, 2591.74],
      notes: "",
    },
    {
      id: "mat-terminal-preaislado-ojal-rojo-a4",
      name: "terminal preaislado ojal rojo A4",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 8.51,
      previousCosts: [5.8, 4.01, 3.69, 3.47],
      notes: "",
    },
    {
      id: "mat-terminal-ojal-525-10003s",
      name: "terminal ojal 5,25mm. 10003/S",
      unit: "unidad",
      supplier: "Zeta",
      category: "Terminales",
      currency: "ARS",
      currentCost: 45,
      previousCosts: [20, 17.6],
      notes: "",
    },
    {
      id: "mat-terminal-ojal-975-26341s",
      name: "terminal ojal 9,75mm. 26341/S",
      unit: "unidad",
      supplier: "Zeta",
      category: "Terminales",
      currency: "ARS",
      currentCost: 80,
      previousCosts: [36, 32],
      notes: "",
    },
    {
      id: "mat-terminal-preaislado-pala-hembra-roja-a16",
      name: "terminal preaislado pala hembra roja A16",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 79.49,
      previousCosts: [11.12, 6.46, 5.82, 5.17],
      notes: "",
    },
    {
      id: "mat-terminal-preaislado-pala-hembra-azul-b18",
      name: "terminal preasilado pala hembra azul B18",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 87.43,
      previousCosts: [18.08, 5.67, 4.91, 4.51],
      notes: "",
    },
    {
      id: "mat-terminal-preaislado-pala-hembra-amarillo-c15",
      name: "terminal preaislado pala hembra amarillo C15",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 104.92,
      previousCosts: [21.72, 8.55, 7.7, 6.83],
      notes: "",
    },
    {
      id: "mat-terminal-pala-hembra-rojo-a18",
      name: "terminal pala hembra rojo A18",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 28.5,
      previousCosts: [27.13, 14.7, 10.65, 9.61],
      notes: "",
    },
    {
      id: "mat-terminal-pala-hembra-azul-b20",
      name: "terminal pala hembra azul B20",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 26.92,
      previousCosts: [21.83, 13.37, 10.65, 9.61],
      notes: "",
    },
    {
      id: "mat-terminal-pala-hembra-amarillo-c17",
      name: "terminal pala hembra amarillo C17",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 36.18,
      previousCosts: [29.91, 17.76, 14.16, 12.77],
      notes: "",
    },
    {
      id: "mat-terminal-pala-macho-635",
      name: "terminal pala macho 6,35 x 0,8 mm",
      unit: "unidad",
      supplier: "Zeta",
      category: "Terminales",
      currency: "ARS",
      currentCost: 75,
      previousCosts: [60, 45],
      notes: "",
    },
    {
      id: "mat-terminal-pala-hembra-635",
      name: "terminal pala hembra 6,35 x 0,8 mm",
      unit: "unidad",
      supplier: "Zeta",
      category: "Terminales",
      currency: "ARS",
      currentCost: 65,
      previousCosts: [45, 21.26, 7.19],
      notes: "",
    },
    {
      id: "mat-empalme-pre-aislada-roja-a14",
      name: "empalme pre aislada roja A14",
      unit: "unidad",
      supplier: "ML",
      category: "Terminales",
      currency: "ARS",
      currentCost: 102,
      previousCosts: [97.33, 157.78, 45.7, 43.66],
      notes: "",
    },
    {
      id: "mat-empalme-pre-aislada-azul-b16",
      name: "empalme pre aislada azul B16",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 111.58,
      previousCosts: [106.42, 211, 63.56, 49.65],
      notes: "",
    },
    {
      id: "mat-empalme-pre-aislada-amarillo-c14",
      name: "empalme pre aislada amarillo C14",
      unit: "unidad",
      supplier: "Janored",
      category: "Terminales",
      currency: "ARS",
      currentCost: 238.78,
      previousCosts: [189.9, 189.9, 164.95, 28.04],
      notes: "",
    },
    {
      id: "mat-ficha-8-vias-porta-pala-hembra",
      name: "Ficha de 8 vias porta pala hembra",
      unit: "unidad",
      supplier: "Zeta",
      category: "Conectores",
      currency: "ARS",
      currentCost: 94.75,
      previousCosts: [120.19, 109.62, 84.38, 76.09],
      notes: "",
    },
    {
      id: "mat-cano-flex-1",
      name: "caño flexible negro con corte 1\"",
      unit: "metro",
      supplier: "Janored",
      category: "Proteccion",
      currency: "ARS",
      currentCost: 1150,
      previousCosts: [1088.59, 1053.47, 962.52, 962.52],
      notes: "",
    },
    {
      id: "mat-cano-flex-34",
      name: "caño flexible negro con corte 3/4\"",
      unit: "metro",
      supplier: "Janored",
      category: "Proteccion",
      currency: "ARS",
      currentCost: 879.16,
      previousCosts: [834.06, 807.16, 737.88, 737.88],
      notes: "",
    },
    {
      id: "mat-cano-flex-12",
      name: "caño flexible negro con corte 1/2\"",
      unit: "metro",
      supplier: "Janored",
      category: "Proteccion",
      currency: "ARS",
      currentCost: 697.26,
      previousCosts: [663.73, 642.32, 585, 585],
      notes: "",
    },
    {
      id: "mat-cano-flex-38",
      name: "caño flexible negro con corte 3/8\"",
      unit: "metro",
      supplier: "Janored",
      category: "Proteccion",
      currency: "ARS",
      currentCost: 653.68,
      previousCosts: [620.65, 600.63, 547.56, 526.5],
      notes: "",
    },
    {
      id: "mat-cinta-aisladora-negra-20m",
      name: "cinta aisladora negra 20m",
      unit: "unidad",
      supplier: "Janored",
      category: "Aislacion",
      currency: "ARS",
      currentCost: 2208,
      previousCosts: [1950, 1725.73, 1656, 1644],
      notes: "",
    },
  ],
  products: [
    {
      id: "pr-k180",
      code: "K180",
      name: "K180 completo",
      kind: "completo",
      salePriceArs: 281207,
      family: "Klase",
      laborHours: 2.6,
      laborHourlyRateArs: 18500,
      targetMarginPercent: 35,
      recipeSummary: [
        "Ficha A y B K180",
        "Cableado base",
        "Terminales",
        "Armado final",
      ],
      recipeItems: [
        {
          id: "ri-k180-1",
          name: "Relay ku-35n 12v 50a",
          supplier: "Autopartes Pilar",
          unit: "u",
          quantity: 2,
          unitCostArs: 1600,
        },
        {
          id: "ri-k180-2",
          name: "Fusilera genrod 6 vias",
          supplier: "Janored",
          unit: "u",
          quantity: 1,
          unitCostArs: 7939.57,
        },
        {
          id: "ri-k180-3",
          name: "Fusibles 10A",
          supplier: "Janored",
          unit: "u",
          quantity: 8,
          unitCostArs: 142,
        },
        {
          id: "ri-k180-4",
          name: "Terminales y empalmes",
          supplier: "Janored / Zeta",
          unit: "kit",
          quantity: 1,
          unitCostArs: 12850,
        },
        {
          id: "ri-k180-5",
          name: "Ficha 8 vias y cableado",
          supplier: "Zeta / Janored",
          unit: "kit",
          quantity: 1,
          unitCostArs: 46200,
        },
      ],
    },
    {
      id: "pr-k180-fab",
      code: "K180-FAB",
      name: "Ficha A y B K180",
      kind: "subcable",
      salePriceArs: 40500,
      family: "Klase",
      laborHours: 0.55,
      laborHourlyRateArs: 18500,
      targetMarginPercent: 28,
      recipeSummary: ["Relay", "Fusibles", "Terminales", "Mano de obra"],
      recipeItems: [
        {
          id: "ri-k180fab-1",
          name: "Relay y fusibles",
          supplier: "Janored",
          unit: "kit",
          quantity: 1,
          unitCostArs: 11800,
        },
        {
          id: "ri-k180fab-2",
          name: "Terminales y aislacion",
          supplier: "Janored / Zeta",
          unit: "kit",
          quantity: 1,
          unitCostArs: 6800,
        },
      ],
    },
    {
      id: "pr-k2400",
      code: "K2400",
      name: "K2400 completo",
      kind: "completo",
      salePriceArs: 784500,
      family: "Klase",
      laborHours: 6.2,
      laborHourlyRateArs: 18500,
      targetMarginPercent: 38,
      recipeSummary: [
        "Tablero K2400",
        "Chicote audio",
        "Cortesia",
        "Armado final",
      ],
      recipeItems: [
        {
          id: "ri-k2400-1",
          name: "Tablero base K2400",
          supplier: "Janored",
          unit: "u",
          quantity: 1,
          unitCostArs: 138000,
        },
        {
          id: "ri-k2400-2",
          name: "Chicote audio",
          supplier: "Janored",
          unit: "u",
          quantity: 1,
          unitCostArs: 48750,
        },
        {
          id: "ri-k2400-3",
          name: "Cortesia y accesorios",
          supplier: "Janored / Zeta",
          unit: "kit",
          quantity: 1,
          unitCostArs: 39100,
        },
        {
          id: "ri-k2400-4",
          name: "Cableado y terminales",
          supplier: "Janored",
          unit: "kit",
          quantity: 1,
          unitCostArs: 176500,
        },
      ],
    },
    {
      id: "pr-v180",
      code: "V180",
      name: "Vision 180",
      kind: "completo",
      salePriceArs: 410000,
      family: "Vision",
      laborHours: 3.4,
      laborHourlyRateArs: 18500,
      targetMarginPercent: 32,
      recipeSummary: [
        "Bornera",
        "Empalmes",
        "Subcables",
        "Control de calidad",
      ],
      recipeItems: [
        {
          id: "ri-v180-1",
          name: "Bornera principal",
          supplier: "Janored",
          unit: "u",
          quantity: 1,
          unitCostArs: 28400,
        },
        {
          id: "ri-v180-2",
          name: "Empalmes y terminales",
          supplier: "Janored / Zeta",
          unit: "kit",
          quantity: 1,
          unitCostArs: 42300,
        },
        {
          id: "ri-v180-3",
          name: "Subcables base",
          supplier: "Janored",
          unit: "kit",
          quantity: 1,
          unitCostArs: 141000,
        },
      ],
    },
    {
      id: "pr-v150",
      code: "V150",
      name: "Vision 150",
      kind: "completo",
      salePriceArs: 265000,
      family: "Vision",
      laborHours: 2.1,
      laborHourlyRateArs: 18500,
      targetMarginPercent: 30,
      recipeSummary: [
        "Base compacta",
        "Tablero",
        "Terminales",
        "Prueba final",
      ],
      recipeItems: [
        {
          id: "ri-v150-1",
          name: "Base compacta",
          supplier: "Janored",
          unit: "u",
          quantity: 1,
          unitCostArs: 36500,
        },
        {
          id: "ri-v150-2",
          name: "Terminales y cable",
          supplier: "Janored / Zeta",
          unit: "kit",
          quantity: 1,
          unitCostArs: 68400,
        },
      ],
    },
  ],
  orders: deriveOrders([
    {
      id: "or-001",
      shipyardId: "sy-klase",
      orderedAt: "2026-05-27",
      deliveryDueAt: "2026-06-03",
      status: "pendiente",
      customerNotes: "Te encargo 2 juegos de 285.",
      internalNotes: "Confirmar si una unidad sale parcial con fichas listas.",
      createdByUserId: "u-admin-pablo",
      items: [
        {
          id: "oi-001",
          productId: "pr-k180",
          quantityOrdered: 2,
          quantityProduced: 1,
          quantityDelivered: 0,
        },
      ],
      productionEntries: [
        {
          id: "pe-001",
          orderItemId: "oi-001",
          createdAt: "2026-05-28T09:30:00.000Z",
          createdByUserId: "u-operador-1",
          createdByName: "Operador taller",
          quantity: 1,
          note: "Primer juego terminado y probado.",
        },
      ],
      deliveryEntries: [],
    },
    {
      id: "or-002",
      shipyardId: "sy-canestrari",
      orderedAt: "2026-05-29",
      deliveryDueAt: "2026-06-07",
      status: "pendiente",
      customerNotes: "Necesito un K2400 para la semana que viene.",
      internalNotes: "Prioridad media. Revisar stock de terminales grandes.",
      createdByUserId: "u-admin-socio",
      items: [
        {
          id: "oi-002",
          productId: "pr-k2400",
          quantityOrdered: 1,
          quantityProduced: 0,
          quantityDelivered: 0,
        },
      ],
      productionEntries: [],
      deliveryEntries: [],
    },
    {
      id: "or-003",
      shipyardId: "sy-vision",
      orderedAt: "2026-05-26",
      deliveryDueAt: "2026-06-10",
      status: "pendiente",
      customerNotes: "Cuando puedas haceme 2 180 y 2 150 eco.",
      internalNotes: "Ideal despachar todo junto si llegan materiales.",
      createdByUserId: "u-admin-pablo",
      items: [
        {
          id: "oi-003",
          productId: "pr-v180",
          quantityOrdered: 2,
          quantityProduced: 2,
          quantityDelivered: 1,
        },
        {
          id: "oi-004",
          productId: "pr-v150",
          quantityOrdered: 2,
          quantityProduced: 1,
          quantityDelivered: 0,
        },
      ],
      productionEntries: [
        {
          id: "pe-002",
          orderItemId: "oi-003",
          createdAt: "2026-05-27T13:00:00.000Z",
          createdByUserId: "u-operador-1",
          createdByName: "Operador taller",
          quantity: 2,
          note: "V180 listos, falta entregar uno.",
        },
        {
          id: "pe-003",
          orderItemId: "oi-004",
          createdAt: "2026-05-28T17:10:00.000Z",
          createdByUserId: "u-operador-1",
          createdByName: "Operador taller",
          quantity: 1,
          note: "Primer V150 eco armado.",
        },
      ],
      deliveryEntries: [
        {
          id: "de-001",
          orderItemId: "oi-003",
          createdAt: "2026-05-29T11:00:00.000Z",
          createdByUserId: "u-admin-pablo",
          createdByName: "Pablo",
          quantity: 1,
          note: "Se entrego una unidad en visita semanal.",
        },
      ],
    },
  ]),
  cashAccounts: [
    { id: "ca-ars", name: "Caja ARS", currency: "ARS" },
    { id: "ca-usd", name: "Caja USD", currency: "USD" },
  ],
  cashMovements: [
    {
      id: "cm-001",
      cashAccountId: "ca-ars",
      movementDate: "2026-05-24",
      type: "ingreso",
      category: "Cobro",
      concept: "Entrega Canestrari",
      amount: 5226000,
      currency: "ARS",
      createdAt: "2026-05-24T15:30:00.000Z",
      createdByUserId: "u-admin-pablo",
      createdByName: "Pablo",
    },
    {
      id: "cm-002",
      cashAccountId: "ca-ars",
      movementDate: "2026-05-28",
      type: "egreso",
      category: "Materiales",
      concept: "Compra materiales Janored",
      amount: 575142,
      currency: "ARS",
      createdAt: "2026-05-28T17:00:00.000Z",
      createdByUserId: "u-admin-socio",
      createdByName: "Socio",
    },
    {
      id: "cm-003",
      cashAccountId: "ca-ars",
      movementDate: "2026-05-29",
      type: "egreso",
      category: "Sueldos",
      concept: "Pago MO semanal",
      amount: 117000,
      currency: "ARS",
      createdAt: "2026-05-29T18:20:00.000Z",
      createdByUserId: "u-admin-pablo",
      createdByName: "Pablo",
    },
    {
      id: "cm-004",
      cashAccountId: "ca-usd",
      movementDate: "2026-05-20",
      type: "ingreso",
      category: "Ahorro",
      concept: "Reserva para futuras compras",
      amount: 1850,
      currency: "USD",
      createdAt: "2026-05-20T12:00:00.000Z",
      createdByUserId: "u-admin-pablo",
      createdByName: "Pablo",
    },
  ],
  receivables: [
    {
      id: "rc-001",
      shipyardId: "sy-canestrari",
      concept: "Saldo pendiente entrega mayo",
      originDate: "2026-05-22",
      dueDate: "2026-06-05",
      currency: "ARS",
      totalAmount: 3445000,
      collectedAmount: 0,
      createdAt: "2026-05-22T10:00:00.000Z",
      createdByUserId: "u-admin-pablo",
      createdByName: "Pablo",
    },
    {
      id: "rc-002",
      shipyardId: "sy-vision",
      concept: "Entrega Vision pendiente",
      originDate: "2026-05-28",
      dueDate: "2026-06-04",
      currency: "ARS",
      totalAmount: 590000,
      collectedAmount: 0,
      createdAt: "2026-05-28T13:00:00.000Z",
      createdByUserId: "u-admin-socio",
      createdByName: "Socio",
    },
  ],
  payables: [
    {
      id: "py-001",
      supplierName: "Janored",
      concept: "Materiales mayo",
      originDate: "2026-05-28",
      dueDate: "2026-06-03",
      currency: "ARS",
      totalAmount: 1170000,
      paidAmount: 575142,
      createdAt: "2026-05-28T17:05:00.000Z",
      createdByUserId: "u-admin-pablo",
      createdByName: "Pablo",
    },
  ],
};

function deriveStatus(items: AppOrderItem[]): OrderStatus {
  const allDelivered = items.every(
    (item) => item.quantityDelivered >= item.quantityOrdered,
  );
  if (allDelivered) {
    return "entregado";
  }

  const anyDelivered = items.some((item) => item.quantityDelivered > 0);
  const allProduced = items.every(
    (item) => item.quantityProduced >= item.quantityOrdered,
  );
  if (anyDelivered) {
    return "parcial";
  }

  if (allProduced) {
    return "terminado";
  }

  const anyProduced = items.some((item) => item.quantityProduced > 0);
  if (anyProduced) {
    return "en_produccion";
  }

  return "pendiente";
}

function deriveOrders(orders: AppOrder[]) {
  return orders.map((order) => ({
    ...order,
    status: deriveStatus(order.items),
    productionEntries: order.productionEntries ?? [],
    deliveryEntries: order.deliveryEntries ?? [],
  }));
}

function normalizeUsers(users: AppUser[] | undefined) {
  const defaultsById = new Map(seedState.users.map((user) => [user.id, user]));
  return (users ?? seedState.users).map((user) => {
    const defaultUser = defaultsById.get(user.id);
    const normalizedEmail =
      user.email && user.email.trim() !== ""
        ? user.email
        : defaultUser?.email ?? "";

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      email: normalizedEmail,
      active: user.active ?? defaultUser?.active ?? true,
    };
  });
}

function normalizeProducts(products: AppProduct[] | undefined) {
  const defaultsById = new Map(seedState.products.map((product) => [product.id, product]));

  return (products ?? seedState.products).map((product) => {
    const defaultProduct = defaultsById.get(product.id);

    return {
      id: product.id,
      code: product.code,
      name: product.name,
      kind: product.kind,
      salePriceArs: product.salePriceArs ?? defaultProduct?.salePriceArs ?? 0,
      family: product.family,
      recipeSummary: product.recipeSummary ?? defaultProduct?.recipeSummary ?? [],
      laborHours: product.laborHours ?? defaultProduct?.laborHours ?? 0,
      laborHourlyRateArs:
        product.laborHourlyRateArs ?? defaultProduct?.laborHourlyRateArs ?? 0,
      targetMarginPercent:
        product.targetMarginPercent ?? defaultProduct?.targetMarginPercent ?? 0,
      recipeItems: product.recipeItems ?? defaultProduct?.recipeItems ?? [],
    };
  });
}

function normalizeMaterials(materials: AppMaterial[] | undefined) {
  const defaultsById = new Map(seedState.materials.map((material) => [material.id, material]));

  return (materials ?? seedState.materials).map((material) => {
    const defaultMaterial = defaultsById.get(material.id);

    return {
      id: material.id,
      name: material.name,
      unit: material.unit ?? defaultMaterial?.unit ?? "unidad",
      supplier: material.supplier ?? defaultMaterial?.supplier ?? "",
      category: material.category ?? defaultMaterial?.category ?? "General",
      currency: material.currency ?? defaultMaterial?.currency ?? "ARS",
      currentCost: material.currentCost ?? defaultMaterial?.currentCost ?? 0,
      previousCosts: material.previousCosts ?? defaultMaterial?.previousCosts ?? [],
      notes: material.notes ?? defaultMaterial?.notes ?? "",
    };
  });
}

function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      users: normalizeUsers(parsed.users),
      shipyards: parsed.shipyards ?? seedState.shipyards,
      materials: normalizeMaterials(parsed.materials),
      products: normalizeProducts(parsed.products),
      orders: deriveOrders(parsed.orders ?? seedState.orders),
      cashAccounts: parsed.cashAccounts ?? seedState.cashAccounts,
      cashMovements: parsed.cashMovements ?? seedState.cashMovements,
      receivables: parsed.receivables ?? seedState.receivables,
      payables: parsed.payables ?? seedState.payables,
    };
  } catch {
    return seedState;
  }
}

function parseRemoteState(data: DocumentData | undefined): SharedAppState | null {
  if (!data) {
    return null;
  }

  const candidate = data.appState as SharedAppState | undefined;
  if (!candidate) {
    return null;
  }

  return {
    users: normalizeUsers(candidate.users),
    shipyards: candidate.shipyards ?? seedState.shipyards,
    materials: normalizeMaterials(candidate.materials),
    products: normalizeProducts(candidate.products),
    orders: deriveOrders(candidate.orders ?? seedState.orders),
    cashAccounts: candidate.cashAccounts ?? seedState.cashAccounts,
    cashMovements: candidate.cashMovements ?? seedState.cashMovements,
    receivables: candidate.receivables ?? seedState.receivables,
    payables: candidate.payables ?? seedState.payables,
  };
}

function matchingCashAccountId(
  accounts: AppCashAccount[],
  currency: CashCurrency,
) {
  return (
    accounts.find((account) => account.currency === currency)?.id ??
    accounts[0]?.id ??
    ""
  );
}

export function useAppState(
  firebaseUid: string | null,
  firebaseEmail: string | null,
) {
  const [state, setState] = useState<AppState>(loadState);
  const [syncStatus, setSyncStatus] = useState<
    "local" | "connecting" | "synced" | "error"
  >("local");
  const remoteStateRef = useRef<string>("");
  const skipNextWriteRef = useRef(false);
  const workspaceRef = useMemo(
    () => doc(db, WORKSPACE_DOC_PATH[0], WORKSPACE_DOC_PATH[1]),
    [],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!firebaseUid) {
      setSyncStatus("local");
      return;
    }

    let mounted = true;
    setSyncStatus("connecting");

    const unsubscribe = onSnapshot(
      workspaceRef,
      async (snapshot) => {
        if (!mounted) {
          return;
        }

        if (!snapshot.exists()) {
          const localState = loadState();
          remoteStateRef.current = JSON.stringify(localState);
          skipNextWriteRef.current = true;
          await setDoc(
            workspaceRef,
            {
              appState: localState,
              updatedAt: new Date().toISOString(),
              updatedByFirebaseUid: firebaseUid,
            },
            { merge: true },
          );
          setState(localState);
          setSyncStatus("synced");
          return;
        }

        const remoteState = parseRemoteState(snapshot.data());
        if (!remoteState) {
          setSyncStatus("error");
          return;
        }

        remoteStateRef.current = JSON.stringify(remoteState);
        skipNextWriteRef.current = true;
        setState(remoteState);
        setSyncStatus("synced");
      },
      () => {
        if (mounted) {
          setSyncStatus("error");
        }
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [firebaseUid, workspaceRef]);

  useEffect(() => {
    if (!firebaseUid || syncStatus === "connecting") {
      return;
    }

    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }

    const serialized = JSON.stringify(state);
    if (serialized === remoteStateRef.current) {
      return;
    }

    remoteStateRef.current = serialized;
    void setDoc(
      workspaceRef,
      {
        appState: state,
        updatedAt: new Date().toISOString(),
        updatedByFirebaseUid: firebaseUid,
      },
      { merge: true },
    ).then(
      () => setSyncStatus("synced"),
      () => setSyncStatus("error"),
    );
  }, [firebaseUid, state, syncStatus, workspaceRef]);

  function createOrder(input: CreateOrderInput, userId: string) {
    const cleanedItems = input.items.filter(
      (item) => item.productId && item.quantityOrdered > 0,
    );
    if (cleanedItems.length === 0) {
      return;
    }

    setState((current) => {
      const nextOrder: AppOrder = {
        id: crypto.randomUUID(),
        shipyardId: input.shipyardId,
        orderedAt: input.orderedAt,
        deliveryDueAt: input.deliveryDueAt,
        status: "pendiente",
        customerNotes: input.customerNotes.trim(),
        internalNotes: input.internalNotes.trim(),
        createdByUserId: userId,
        items: cleanedItems.map((item) => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          quantityProduced: 0,
          quantityDelivered: 0,
        })),
        productionEntries: [],
        deliveryEntries: [],
      };

      return {
        ...current,
        orders: deriveOrders([nextOrder, ...current.orders]),
      };
    });
  }

  function recordProduction(input: ProductionInput, user: AppUser) {
    if (input.quantity <= 0) {
      return;
    }

    setState((current) => ({
      ...current,
      orders: deriveOrders(
        current.orders.map((order) => {
          if (order.id !== input.orderId) {
            return order;
          }

          return {
            ...order,
            items: order.items.map((item) => {
              if (item.id !== input.orderItemId) {
                return item;
              }

              return {
                ...item,
                quantityProduced: item.quantityProduced + input.quantity,
              };
            }),
            productionEntries: [
              {
                id: crypto.randomUUID(),
                orderItemId: input.orderItemId,
                createdAt: new Date().toISOString(),
                createdByUserId: user.id,
                createdByName: user.name,
                quantity: input.quantity,
                note: input.note.trim(),
              },
              ...order.productionEntries,
            ],
          };
        }),
      ),
    }));
  }

  function recordDelivery(input: DeliveryInput, user: AppUser) {
    if (input.quantity <= 0) {
      return;
    }

    setState((current) => ({
      ...current,
      orders: deriveOrders(
        current.orders.map((order) => {
          if (order.id !== input.orderId) {
            return order;
          }

          let createdDeliveryQuantity = 0;
          return {
            ...order,
            items: order.items.map((item) => {
              if (item.id !== input.orderItemId) {
                return item;
              }

              const maxDeliverable =
                item.quantityProduced - item.quantityDelivered;
              const appliedQuantity = Math.min(
                input.quantity,
                Math.max(0, maxDeliverable),
              );
              createdDeliveryQuantity = appliedQuantity;

              return {
                ...item,
                quantityDelivered: item.quantityDelivered + appliedQuantity,
              };
            }),
            deliveryEntries:
              createdDeliveryQuantity > 0
                ? [
                    {
                      id: crypto.randomUUID(),
                      orderItemId: input.orderItemId,
                      createdAt: new Date().toISOString(),
                      createdByUserId: user.id,
                      createdByName: user.name,
                      quantity: createdDeliveryQuantity,
                      note: input.note.trim(),
                    },
                    ...order.deliveryEntries,
                  ]
                : order.deliveryEntries,
          };
        }),
      ),
    }));
  }

  function createCashMovement(input: CreateCashMovementInput, user: AppUser) {
    if (input.amount <= 0) {
      return;
    }

    setState((current) => {
      const account = current.cashAccounts.find(
        (cashAccount) => cashAccount.id === input.cashAccountId,
      );
      if (!account) {
        return current;
      }

      const nextMovement: AppCashMovement = {
        id: crypto.randomUUID(),
        cashAccountId: input.cashAccountId,
        movementDate: input.movementDate,
        type: input.type,
        category: input.category.trim(),
        concept: input.concept.trim(),
        amount: input.amount,
        currency: account.currency,
        createdAt: new Date().toISOString(),
        createdByUserId: user.id,
        createdByName: user.name,
      };

      return {
        ...current,
        cashMovements: [nextMovement, ...current.cashMovements],
      };
    });
  }

  function createReceivable(input: CreateReceivableInput, user: AppUser) {
    if (input.totalAmount <= 0) {
      return;
    }

    setState((current) => ({
      ...current,
      receivables: [
        {
          id: crypto.randomUUID(),
          shipyardId: input.shipyardId,
          concept: input.concept.trim(),
          originDate: input.originDate,
          dueDate: input.dueDate,
          currency: input.currency,
          totalAmount: input.totalAmount,
          collectedAmount: 0,
          createdAt: new Date().toISOString(),
          createdByUserId: user.id,
          createdByName: user.name,
        },
        ...current.receivables,
      ],
    }));
  }

  function createPayable(input: CreatePayableInput, user: AppUser) {
    if (input.totalAmount <= 0) {
      return;
    }

    setState((current) => ({
      ...current,
      payables: [
        {
          id: crypto.randomUUID(),
          supplierName: input.supplierName.trim(),
          concept: input.concept.trim(),
          originDate: input.originDate,
          dueDate: input.dueDate,
          currency: input.currency,
          totalAmount: input.totalAmount,
          paidAmount: 0,
          createdAt: new Date().toISOString(),
          createdByUserId: user.id,
          createdByName: user.name,
        },
        ...current.payables,
      ],
    }));
  }

  function settleReceivable(input: SettleReceivableInput, user: AppUser) {
    if (input.amount <= 0) {
      return;
    }

    setState((current) => {
      let createdMovement: AppCashMovement | null = null;

      const receivables = current.receivables.map((receivable) => {
        if (receivable.id !== input.receivableId) {
          return receivable;
        }

        const remaining =
          receivable.totalAmount - receivable.collectedAmount;
        const appliedAmount = Math.min(input.amount, Math.max(0, remaining));
        if (appliedAmount <= 0) {
          return receivable;
        }

        const cashAccountId = matchingCashAccountId(
          current.cashAccounts,
          receivable.currency,
        );
        createdMovement = {
          id: crypto.randomUUID(),
          cashAccountId,
          movementDate: new Date().toISOString().slice(0, 10),
          type: "ingreso",
          category: "Cobro",
          concept: `Cobro: ${receivable.concept}`,
          amount: appliedAmount,
          currency: receivable.currency,
          createdAt: new Date().toISOString(),
          createdByUserId: user.id,
          createdByName: user.name,
          linkedEntityType: "receivable",
          linkedEntityId: receivable.id,
        };

        return {
          ...receivable,
          collectedAmount: receivable.collectedAmount + appliedAmount,
        };
      });

      return {
        ...current,
        receivables,
        cashMovements: createdMovement
          ? [createdMovement, ...current.cashMovements]
          : current.cashMovements,
      };
    });
  }

  function settlePayable(input: SettlePayableInput, user: AppUser) {
    if (input.amount <= 0) {
      return;
    }

    setState((current) => {
      let createdMovement: AppCashMovement | null = null;

      const payables = current.payables.map((payable) => {
        if (payable.id !== input.payableId) {
          return payable;
        }

        const remaining = payable.totalAmount - payable.paidAmount;
        const appliedAmount = Math.min(input.amount, Math.max(0, remaining));
        if (appliedAmount <= 0) {
          return payable;
        }

        const cashAccountId = matchingCashAccountId(
          current.cashAccounts,
          payable.currency,
        );
        createdMovement = {
          id: crypto.randomUUID(),
          cashAccountId,
          movementDate: new Date().toISOString().slice(0, 10),
          type: "egreso",
          category: "Pago proveedor",
          concept: `Pago: ${payable.supplierName} / ${payable.concept}`,
          amount: appliedAmount,
          currency: payable.currency,
          createdAt: new Date().toISOString(),
          createdByUserId: user.id,
          createdByName: user.name,
          linkedEntityType: "payable",
          linkedEntityId: payable.id,
        };

        return {
          ...payable,
          paidAmount: payable.paidAmount + appliedAmount,
        };
      });

      return {
        ...current,
        payables,
        cashMovements: createdMovement
          ? [createdMovement, ...current.cashMovements]
          : current.cashMovements,
      };
    });
  }

  function updateUserAccess(input: UpdateUserAccessInput) {
    setState((current) => ({
      ...current,
      users: current.users.map((user) => {
        if (user.id !== input.userId) {
          return user;
        }

        return {
          ...user,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          role: input.role,
          active: input.active,
        };
      }),
    }));
  }

  function updateProductCosting(input: UpdateProductCostingInput) {
    setState((current) => ({
      ...current,
      products: current.products.map((product) => {
        if (product.id !== input.productId) {
          return product;
        }

        return {
          ...product,
          laborHours: Math.max(0, input.laborHours),
          laborHourlyRateArs: Math.max(0, input.laborHourlyRateArs),
          targetMarginPercent: Math.max(0, input.targetMarginPercent),
          salePriceArs: Math.max(0, input.salePriceArs),
        };
      }),
    }));
  }

  const normalizedEmail = firebaseEmail?.trim().toLowerCase() ?? "";
  const currentUser =
    state.users.find(
      (user) =>
        user.active &&
        user.email.trim().toLowerCase() !== "" &&
        user.email.trim().toLowerCase() === normalizedEmail,
    ) ?? null;

  return {
    state,
    currentUser,
    syncStatus,
    updateUserAccess,
    updateProductCosting,
    createOrder,
    recordProduction,
    recordDelivery,
    createCashMovement,
    createReceivable,
    createPayable,
    settleReceivable,
    settlePayable,
  };
}
