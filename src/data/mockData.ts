export const appHighlights = [
  {
    tag: "Pedidos",
    title: "Carga rapida desde el celular",
    description:
      "Astillero, fecha de entrega e items del catalogo con busqueda agil y soporte para entregas parciales.",
  },
  {
    tag: "Produccion",
    title: "Tablero claro para el operador",
    description:
      "Ver cola por urgencia, informar cantidades reales producidas y dejar observaciones de taller.",
  },
  {
    tag: "Caja",
    title: "Movimientos y cierre sin mezcla",
    description:
      "Caja ARS, caja USD, cuentas a cobrar y pagar, y cierres con historial en vez de notas dispersas.",
  },
];

export const sampleProducts = [
  {
    code: "K180",
    kind: "Completo",
    name: "Cable K180 completo",
    summary:
      "Producto fabricable compuesto por subcables y materiales directos. Se vende completo, pero algunos componentes tambien pueden pedirse por separado.",
    components: ["Ficha A y B K180", "Subcable alimentacion", "Terminales", "Cableado base"],
  },
  {
    code: "K180-FAB",
    kind: "Subcable",
    name: "Ficha A y B K180",
    summary:
      "Subcable fabricable con su propia receta y costo. Puede formar parte del K180 completo o venderse por separado.",
    components: ["Relay", "Fusibles", "Terminales", "Mano de obra"],
  },
  {
    code: "V180",
    kind: "Completo",
    name: "Vision 180",
    summary:
      "Ejemplo de producto final que aprovecha la misma logica: receta, precio, mano de obra y seguimiento de produccion.",
    components: ["Bornera", "Empalmes", "Subcables", "Control de calidad"],
  },
];

export const sampleBoard = [
  {
    product: "K180 completo",
    client: "Klase A",
    dueLabel: "Entrega: 03/06",
    qty: "2 u.",
  },
  {
    product: "K2400",
    client: "Canestrari",
    dueLabel: "Entrega: 07/06",
    qty: "1 u.",
  },
  {
    product: "V180",
    client: "Vision",
    dueLabel: "Entrega: 10/06",
    qty: "2 u.",
  },
];

export const cashAccounts = [
  {
    name: "Caja ARS",
    purpose: "Cobros, sueldos, gastos y cierres operativos",
    currency: "ARS",
    example: "$ 5.202.264",
  },
  {
    name: "Caja USD",
    purpose: "Ahorro, retiros y pagos puntuales en dolares",
    currency: "USD",
    example: "USD 1.850",
  },
];

