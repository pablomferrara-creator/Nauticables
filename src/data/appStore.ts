import { useEffect, useState } from "react";
import type { OrderStatus, ProductKind, UserRole } from "../domain/models";

const STORAGE_KEY = "nauticables-local-prototype-v2";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  pinHint: string;
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
}

export interface AppState {
  activeUserId: string | null;
  users: AppUser[];
  shipyards: AppShipyard[];
  products: AppProduct[];
  orders: AppOrder[];
}

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
}

const seedState: AppState = {
  activeUserId: null,
  users: [
    { id: "u-admin-pablo", name: "Pablo", role: "admin", pinHint: "Admin" },
    { id: "u-admin-socio", name: "Socio", role: "admin", pinHint: "Admin" },
    {
      id: "u-operador-1",
      name: "Operador taller",
      role: "operador",
      pinHint: "Solo produccion",
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
  products: [
    {
      id: "pr-k180",
      code: "K180",
      name: "K180 completo",
      kind: "completo",
      salePriceArs: 281207,
      family: "Klase",
      recipeSummary: [
        "Ficha A y B K180",
        "Cableado base",
        "Terminales",
        "Armado final",
      ],
    },
    {
      id: "pr-k180-fab",
      code: "K180-FAB",
      name: "Ficha A y B K180",
      kind: "subcable",
      salePriceArs: 40500,
      family: "Klase",
      recipeSummary: ["Relay", "Fusibles", "Terminales", "Mano de obra"],
    },
    {
      id: "pr-k2400",
      code: "K2400",
      name: "K2400 completo",
      kind: "completo",
      salePriceArs: 784500,
      family: "Klase",
      recipeSummary: [
        "Tablero K2400",
        "Chicote audio",
        "Cortesia",
        "Armado final",
      ],
    },
    {
      id: "pr-v180",
      code: "V180",
      name: "Vision 180",
      kind: "completo",
      salePriceArs: 410000,
      family: "Vision",
      recipeSummary: ["Bornera", "Empalmes", "Subcables", "Control de calidad"],
    },
    {
      id: "pr-v150",
      code: "V150",
      name: "Vision 150",
      kind: "completo",
      salePriceArs: 265000,
      family: "Vision",
      recipeSummary: ["Base compacta", "Tablero", "Terminales", "Prueba final"],
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
    },
  ]),
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
  }));
}

function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedState;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...parsed,
      orders: deriveOrders(parsed.orders),
    };
  } catch {
    return seedState;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function signInAs(userId: string) {
    setState((current) => ({
      ...current,
      activeUserId: userId,
    }));
  }

  function signOut() {
    setState((current) => ({
      ...current,
      activeUserId: null,
    }));
  }

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

  function recordDelivery(input: DeliveryInput) {
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

              const maxDeliverable =
                item.quantityProduced - item.quantityDelivered;
              const appliedQuantity = Math.min(
                input.quantity,
                Math.max(0, maxDeliverable),
              );

              return {
                ...item,
                quantityDelivered: item.quantityDelivered + appliedQuantity,
              };
            }),
          };
        }),
      ),
    }));
  }

  const currentUser =
    state.users.find((user) => user.id === state.activeUserId) ?? null;

  return {
    state,
    currentUser,
    signInAs,
    signOut,
    createOrder,
    recordProduction,
    recordDelivery,
  };
}
