export type UserRole = "admin" | "operador";

export type ProductKind = "completo" | "subcable";

export type RecipeComponentKind = "material" | "producto";

export type OrderStatus =
  | "pendiente"
  | "en_produccion"
  | "parcial"
  | "terminado"
  | "entregado"
  | "cancelado";

export type CashCurrency = "ARS" | "USD";

export type CashMovementType = "ingreso" | "egreso" | "extraccion";

export interface AuditFields {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface UserProfile extends AuditFields {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Shipyard extends AuditFields {
  id: string;
  name: string;
  zone?: string;
  address?: string;
  contactName?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  emailPrimary?: string;
  emailSecondary?: string;
  notes?: string;
  active: boolean;
}

export interface Product extends AuditFields {
  id: string;
  code: string;
  name: string;
  kind: ProductKind;
  salePriceArs?: number;
  laborUnitValueArs?: number;
  active: boolean;
}

export interface RecipeVersion extends AuditFields {
  id: string;
  productId: string;
  versionLabel: string;
  isCurrent: boolean;
}

export interface RecipeComponent extends AuditFields {
  id: string;
  recipeVersionId: string;
  componentKind: RecipeComponentKind;
  materialId?: string;
  childProductId?: string;
  quantity: number;
  notes?: string;
}

export interface Material extends AuditFields {
  id: string;
  name: string;
  defaultSupplier?: string;
  currentPrice: number;
  currency: CashCurrency;
  active: boolean;
}

export interface Order extends AuditFields {
  id: string;
  shipyardId: string;
  orderedAt: string;
  deliveryDueAt: string;
  status: OrderStatus;
  customerNotes?: string;
  internalNotes?: string;
}

export interface OrderItem extends AuditFields {
  id: string;
  orderId: string;
  productId: string;
  quantityOrdered: number;
  quantityProduced: number;
  quantityDelivered: number;
}

export interface ProductionLog extends AuditFields {
  id: string;
  orderItemId: string;
  quantity: number;
  note?: string;
}

export interface CashAccount extends AuditFields {
  id: string;
  name: string;
  currency: CashCurrency;
  active: boolean;
}

export interface CashMovement extends AuditFields {
  id: string;
  cashAccountId: string;
  movementDate: string;
  type: CashMovementType;
  amount: number;
  concept: string;
  linkedEntityType?: "receivable" | "payable" | "wage_batch" | "order";
  linkedEntityId?: string;
  status: "confirmado" | "pendiente" | "anulado";
}

export interface Receivable extends AuditFields {
  id: string;
  shipyardId: string;
  originDate: string;
  dueDate?: string;
  concept: string;
  currency: CashCurrency;
  totalAmount: number;
  collectedAmount: number;
  status: "pendiente" | "parcial" | "cobrado" | "anulado";
}

export interface Payable extends AuditFields {
  id: string;
  supplierName: string;
  originDate: string;
  dueDate?: string;
  concept: string;
  currency: CashCurrency;
  totalAmount: number;
  paidAmount: number;
  status: "pendiente" | "parcial" | "pagado" | "anulado";
}

