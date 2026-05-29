import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  useAppState,
  type AppOrder,
  type AppProduct,
  type AppShipyard,
  type AppUser,
  type CreateOrderInput,
  type DeliveryInput,
  type ProductionInput,
} from "./data/appStore";

type TabId = "resumen" | "pedidos" | "produccion" | "productos" | "astilleros";

interface TabOption {
  id: TabId;
  label: string;
}

const adminTabs: TabOption[] = [
  { id: "resumen", label: "Resumen" },
  { id: "pedidos", label: "Pedidos" },
  { id: "productos", label: "Productos" },
  { id: "astilleros", label: "Astilleros" },
];

const operatorTabs: TabOption[] = [
  { id: "produccion", label: "Produccion" },
  { id: "productos", label: "Catalogo" },
];

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function App() {
  const {
    state,
    currentUser,
    signInAs,
    signOut,
    createOrder,
    recordProduction,
    recordDelivery,
  } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>("resumen");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const availableTabs = currentUser.role === "admin" ? adminTabs : operatorTabs;
    if (availableTabs.some((tab) => tab.id === activeTab)) {
      return;
    }

    startTransition(() => {
      setActiveTab(availableTabs[0].id);
    });
  }, [activeTab, currentUser]);

  if (!currentUser) {
    return <LoginScreen users={state.users} onSelect={signInAs} />;
  }

  const productsById = Object.fromEntries(
    state.products.map((product) => [product.id, product]),
  ) as Record<string, AppProduct>;
  const shipyardsById = Object.fromEntries(
    state.shipyards.map((shipyard) => [shipyard.id, shipyard]),
  ) as Record<string, AppShipyard>;
  const orders = [...state.orders].sort((left, right) =>
    left.deliveryDueAt.localeCompare(right.deliveryDueAt),
  );
  const availableTabs = currentUser.role === "admin" ? adminTabs : operatorTabs;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="topbar__eyebrow">Nauticables / prototipo offline</div>
          <h1>
            {currentUser.role === "admin"
              ? "Centro operativo"
              : "Panel de produccion"}
          </h1>
          <p>
            Por ahora guarda datos en este dispositivo. Cuando conectemos
            Firebase, esta misma estructura se sincroniza entre usuarios.
          </p>
        </div>
        <div className="topbar__meta">
          <div className="user-chip">
            <span>{currentUser.name}</span>
            <strong>
              {currentUser.role === "admin" ? "Admin" : "Operador"}
            </strong>
          </div>
          <button
            className="button button--ghost"
            onClick={signOut}
            type="button"
          >
            Cambiar usuario
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "resumen" && currentUser.role === "admin" ? (
          <OverviewPanel
            orders={orders}
            products={state.products}
            shipyards={state.shipyards}
            productsById={productsById}
            shipyardsById={shipyardsById}
          />
        ) : null}

        {activeTab === "pedidos" && currentUser.role === "admin" ? (
          <OrdersPanel
            currentUser={currentUser}
            orders={orders}
            products={state.products}
            shipyards={state.shipyards}
            productsById={productsById}
            shipyardsById={shipyardsById}
            onCreateOrder={createOrder}
            onRecordProduction={recordProduction}
            onRecordDelivery={recordDelivery}
          />
        ) : null}

        {activeTab === "produccion" ? (
          <ProductionPanel
            currentUser={currentUser}
            orders={orders.filter((order) => order.status !== "entregado")}
            productsById={productsById}
            shipyardsById={shipyardsById}
            onRecordProduction={recordProduction}
          />
        ) : null}

        {activeTab === "productos" ? (
          <ProductsPanel products={state.products} />
        ) : null}

        {activeTab === "astilleros" && currentUser.role === "admin" ? (
          <ShipyardsPanel shipyards={state.shipyards} />
        ) : null}
      </main>

      <nav className="bottom-nav">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            className={
              tab.id === activeTab
                ? "bottom-nav__item is-active"
                : "bottom-nav__item"
            }
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function LoginScreen({
  users,
  onSelect,
}: {
  users: AppUser[];
  onSelect: (userId: string) => void;
}) {
  return (
    <div className="login-shell">
      <div className="login-hero">
        <span className="pill pill--accent">MVP local</span>
        <h1>Nauticables ya puede probarse como app web.</h1>
        <p>
          Elegi un perfil para simular permisos. Mas adelante esto se cambia
          por login real con Firebase.
        </p>
      </div>

      <section className="login-grid">
        {users.map((user) => (
          <button
            key={user.id}
            className="login-card"
            onClick={() => onSelect(user.id)}
            type="button"
          >
            <span className="pill">
              {user.role === "admin" ? "Admin" : "Operador"}
            </span>
            <strong>{user.name}</strong>
            <span>{user.pinHint}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

function OverviewPanel({
  orders,
  products,
  shipyards,
  productsById,
  shipyardsById,
}: {
  orders: AppOrder[];
  products: AppProduct[];
  shipyards: AppShipyard[];
  productsById: Record<string, AppProduct>;
  shipyardsById: Record<string, AppShipyard>;
}) {
  const pendingOrders = orders.filter((order) =>
    ["pendiente", "en_produccion", "parcial"].includes(order.status),
  );
  const completedToday = orders.filter(
    (order) => order.status === "terminado",
  ).length;
  const openDeliveries = orders.filter(
    (order) => order.status !== "entregado",
  ).length;
  const monthlyProjection = orders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((subtotal, item) => {
        const product = productsById[item.productId];
        return subtotal + item.quantityOrdered * (product?.salePriceArs ?? 0);
      }, 0)
    );
  }, 0);

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="section-kicker">Vision general</span>
          <h2>Lo importante antes de abrir la planilla</h2>
        </div>
        <div className="notice">
          La caja y la cobranzas reales quedan para la siguiente pantalla. Hoy
          ya estamos validando flujo de pedidos y produccion.
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Pedidos abiertos"
          value={String(openDeliveries)}
          hint="Con algo pendiente de fabricar o entregar"
        />
        <StatCard
          label="En cola o produccion"
          value={String(pendingOrders.length)}
          hint="Prioridad para el taller"
        />
        <StatCard
          label="Productos catalogados"
          value={String(products.length)}
          hint="Completos y subcables"
        />
        <StatCard
          label="Facturacion potencial"
          value={currency.format(monthlyProjection)}
          hint="Base de los pedidos cargados"
        />
      </div>

      <div className="split-grid">
        <article className="card">
          <div className="card__heading">
            <h3>Pedidos mas cercanos</h3>
            <p>Ordenados por fecha de entrega para mirar urgencias reales.</p>
          </div>
          <div className="stack">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="list-row">
                <div>
                  <strong>
                    {shipyardsById[order.shipyardId]?.name ?? "Astillero"}
                  </strong>
                  <span>{formatOrderItems(order, productsById)}</span>
                </div>
                <div className="list-row__aside">
                  <span>{formatDate(order.deliveryDueAt)}</span>
                  <strong>{statusLabel(order.status)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card__heading">
            <h3>Base comercial</h3>
            <p>Clientes listos para pasar a login y sincronizacion real.</p>
          </div>
          <div className="stack">
            {shipyards.slice(0, 4).map((shipyard) => (
              <div key={shipyard.id} className="list-row">
                <div>
                  <strong>{shipyard.name}</strong>
                  <span>{shipyard.contactName}</span>
                </div>
                <div className="list-row__aside">
                  <span>{shipyard.zone}</span>
                  <strong>{shipyard.phone}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="card__footer">
            <strong>{completedToday}</strong>
            <span>pedidos ya estan listos para pasar a entrega completa</span>
          </div>
        </article>
      </div>
    </section>
  );
}

function OrdersPanel({
  currentUser,
  orders,
  products,
  shipyards,
  productsById,
  shipyardsById,
  onCreateOrder,
  onRecordProduction,
  onRecordDelivery,
}: {
  currentUser: AppUser;
  orders: AppOrder[];
  products: AppProduct[];
  shipyards: AppShipyard[];
  productsById: Record<string, AppProduct>;
  shipyardsById: Record<string, AppShipyard>;
  onCreateOrder: (input: CreateOrderInput, userId: string) => void;
  onRecordProduction: (input: ProductionInput, user: AppUser) => void;
  onRecordDelivery: (input: DeliveryInput) => void;
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const filteredOrders = orders.filter((order) => {
    const shipyardName = shipyardsById[order.shipyardId]?.name ?? "";
    const productsText = formatOrderItems(order, productsById);
    const haystack =
      `${shipyardName} ${productsText} ${order.customerNotes}`.toLowerCase();
    return haystack.includes(deferredSearch.trim().toLowerCase());
  });

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="section-kicker">Pedidos</span>
          <h2>Carga rapida y seguimiento sin abrir el sheet</h2>
        </div>
        <label className="search">
          <span>Buscar</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Astillero, codigo o nota"
            value={search}
          />
        </label>
      </div>

      <div className="split-grid split-grid--wide">
        <NewOrderForm
          currentUser={currentUser}
          products={products}
          shipyards={shipyards}
          onCreateOrder={onCreateOrder}
        />

        <article className="card">
          <div className="card__heading">
            <h3>Pedidos cargados</h3>
            <p>
              Ordenados por fecha de entrega, listos para produccion y entrega
              parcial.
            </p>
          </div>
          <div className="stack">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                currentUser={currentUser}
                order={order}
                productsById={productsById}
                shipyardsById={shipyardsById}
                onRecordProduction={onRecordProduction}
                onRecordDelivery={onRecordDelivery}
              />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ProductionPanel({
  currentUser,
  orders,
  productsById,
  shipyardsById,
  onRecordProduction,
}: {
  currentUser: AppUser;
  orders: AppOrder[];
  productsById: Record<string, AppProduct>;
  shipyardsById: Record<string, AppShipyard>;
  onRecordProduction: (input: ProductionInput, user: AppUser) => void;
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="section-kicker">Taller</span>
          <h2>Cola de trabajo del operador</h2>
        </div>
        <div className="notice">
          Solo muestra lo que queda fabricar o entregar. El objetivo es que
          esta pantalla se pueda usar con el celular en el taller.
        </div>
      </div>

      <div className="stack">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            currentUser={currentUser}
            order={order}
            productsById={productsById}
            shipyardsById={shipyardsById}
            onRecordProduction={onRecordProduction}
          />
        ))}
      </div>
    </section>
  );
}

function ProductsPanel({ products }: { products: AppProduct[] }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const filteredProducts = products.filter((product) => {
    const haystack =
      `${product.code} ${product.name} ${product.family}`.toLowerCase();
    return haystack.includes(deferredSearch.trim().toLowerCase());
  });

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="section-kicker">Catalogo</span>
          <h2>Completos y subcables con una sola logica</h2>
        </div>
        <label className="search">
          <span>Buscar</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="K180, V180, ficha..."
            value={search}
          />
        </label>
      </div>

      <div className="card-grid">
        {filteredProducts.map((product) => (
          <article key={product.id} className="card card--product">
            <div className="card__row">
              <span className="pill">
                {product.kind === "completo" ? "Completo" : "Subcable"}
              </span>
              <strong>{product.code}</strong>
            </div>
            <h3>{product.name}</h3>
            <p>{product.family}</p>
            <div className="chips">
              {product.recipeSummary.map((component) => (
                <span key={component} className="chip">
                  {component}
                </span>
              ))}
            </div>
            <div className="card__footer">
              <strong>{currency.format(product.salePriceArs)}</strong>
              <span>precio de referencia actual</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ShipyardsPanel({ shipyards }: { shipyards: AppShipyard[] }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <span className="section-kicker">Astilleros</span>
          <h2>Base lista para clientes, contactos y seguimiento</h2>
        </div>
      </div>

      <div className="card-grid">
        {shipyards.map((shipyard) => (
          <article key={shipyard.id} className="card">
            <div className="card__heading">
              <h3>{shipyard.name}</h3>
              <p>{shipyard.zone}</p>
            </div>
            <div className="detail-list">
              <div>
                <span>Contacto</span>
                <strong>{shipyard.contactName}</strong>
              </div>
              <div>
                <span>Telefono</span>
                <strong>{shipyard.phone}</strong>
              </div>
              <div>
                <span>Notas</span>
                <strong>{shipyard.notes}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewOrderForm({
  currentUser,
  products,
  shipyards,
  onCreateOrder,
}: {
  currentUser: AppUser;
  products: AppProduct[];
  shipyards: AppShipyard[];
  onCreateOrder: (input: CreateOrderInput, userId: string) => void;
}) {
  const [shipyardId, setShipyardId] = useState(shipyards[0]?.id ?? "");
  const [orderedAt, setOrderedAt] = useState(todayIso());
  const [deliveryDueAt, setDeliveryDueAt] = useState(daysFromToday(7));
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [items, setItems] = useState([
    { productId: products[0]?.id ?? "", quantityOrdered: 1 },
  ]);

  function updateItem(
    index: number,
    nextValue: { productId?: string; quantityOrdered?: number },
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextValue } : item,
      ),
    );
  }

  function resetForm() {
    setCustomerNotes("");
    setInternalNotes("");
    setOrderedAt(todayIso());
    setDeliveryDueAt(daysFromToday(7));
    setItems([{ productId: products[0]?.id ?? "", quantityOrdered: 1 }]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateOrder(
      {
        shipyardId,
        orderedAt,
        deliveryDueAt,
        customerNotes,
        internalNotes,
        items,
      },
      currentUser.id,
    );
    resetForm();
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card__heading">
        <h3>Cargar pedido</h3>
        <p>Manual, rapido y pensando en como hoy te llegan por WhatsApp.</p>
      </div>

      <div className="form-grid">
        <label>
          <span>Astillero</span>
          <select
            onChange={(event) => setShipyardId(event.target.value)}
            value={shipyardId}
          >
            {shipyards.map((shipyard) => (
              <option key={shipyard.id} value={shipyard.id}>
                {shipyard.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Fecha pedido</span>
          <input
            onChange={(event) => setOrderedAt(event.target.value)}
            type="date"
            value={orderedAt}
          />
        </label>

        <label>
          <span>Fecha entrega</span>
          <input
            onChange={(event) => setDeliveryDueAt(event.target.value)}
            type="date"
            value={deliveryDueAt}
          />
        </label>
      </div>

      <div className="item-builder">
        {items.map((item, index) => (
          <div key={`${index}-${item.productId}`} className="item-builder__row">
            <label>
              <span>Producto</span>
              <select
                onChange={(event) =>
                  updateItem(index, { productId: event.target.value })
                }
                value={item.productId}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Cantidad</span>
              <input
                min="1"
                onChange={(event) =>
                  updateItem(index, {
                    quantityOrdered: Number(event.target.value),
                  })
                }
                type="number"
                value={item.quantityOrdered}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="inline-actions">
        <button
          className="button button--ghost"
          onClick={() =>
            setItems((current) => [
              ...current,
              { productId: products[0]?.id ?? "", quantityOrdered: 1 },
            ])
          }
          type="button"
        >
          Agregar otro item
        </button>
      </div>

      <label>
        <span>Nota del cliente</span>
        <textarea
          onChange={(event) => setCustomerNotes(event.target.value)}
          placeholder='Ejemplo: "cuando puedas haceme 2 180 y 2 150 eco"'
          rows={3}
          value={customerNotes}
        />
      </label>

      <label>
        <span>Nota interna</span>
        <textarea
          onChange={(event) => setInternalNotes(event.target.value)}
          placeholder="Urgencia, materiales, observaciones de entrega..."
          rows={3}
          value={internalNotes}
        />
      </label>

      <button className="button button--primary" type="submit">
        Guardar pedido
      </button>
    </form>
  );
}

function OrderCard({
  currentUser,
  order,
  productsById,
  shipyardsById,
  onRecordProduction,
  onRecordDelivery,
}: {
  currentUser: AppUser;
  order: AppOrder;
  productsById: Record<string, AppProduct>;
  shipyardsById: Record<string, AppShipyard>;
  onRecordProduction: (input: ProductionInput, user: AppUser) => void;
  onRecordDelivery?: (input: DeliveryInput) => void;
}) {
  const [drafts, setDrafts] = useState<
    Record<string, { production: number; delivery: number; note: string }>
  >({});

  function currentDraft(itemId: string) {
    return drafts[itemId] ?? { production: 1, delivery: 1, note: "" };
  }

  function updateDraft(
    itemId: string,
    nextValue: Partial<{ production: number; delivery: number; note: string }>,
  ) {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...currentDraft(itemId),
        ...nextValue,
      },
    }));
  }

  return (
    <article className="order-card">
      <div className="order-card__header">
        <div>
          <div className="card__row">
            <strong>{shipyardsById[order.shipyardId]?.name ?? "Astillero"}</strong>
            <span className={`status status--${order.status}`}>
              {statusLabel(order.status)}
            </span>
          </div>
          <p>Entrega {formatDate(order.deliveryDueAt)}</p>
        </div>
        <div className="order-card__meta">
          <span>Pedido {formatDate(order.orderedAt)}</span>
          <strong>{formatOrderItems(order, productsById)}</strong>
        </div>
      </div>

      {order.customerNotes ? (
        <p className="muted-block">Cliente: {order.customerNotes}</p>
      ) : null}
      {order.internalNotes ? (
        <p className="muted-block">Interno: {order.internalNotes}</p>
      ) : null}

      <div className="stack">
        {order.items.map((item) => {
          const product = productsById[item.productId];
          const pendingProduction = Math.max(
            0,
            item.quantityOrdered - item.quantityProduced,
          );
          const deliverable = Math.max(
            0,
            item.quantityProduced - item.quantityDelivered,
          );
          const draft = currentDraft(item.id);

          return (
            <div key={item.id} className="progress-card">
              <div className="progress-card__header">
                <div>
                  <strong>{product?.code ?? "Producto"}</strong>
                  <span>{product?.name ?? "Sin nombre"}</span>
                </div>
                <strong>
                  {item.quantityProduced}/{item.quantityOrdered} prod.
                </strong>
              </div>

              <div className="meter">
                <span
                  className="meter__fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (item.quantityProduced / item.quantityOrdered) * 100,
                    )}%`,
                  }}
                />
              </div>

              <div className="progress-card__stats">
                <span>Pendiente fabricar: {pendingProduction}</span>
                <span>Disponible para entregar: {deliverable}</span>
                <span>Entregado: {item.quantityDelivered}</span>
              </div>

              {order.productionEntries
                .filter((entry) => entry.orderItemId === item.id)
                .slice(0, 2)
                .map((entry) => (
                  <div key={entry.id} className="log-entry">
                    <strong>+{entry.quantity}</strong>
                    <span>
                      {entry.createdByName} - {formatDateTime(entry.createdAt)}
                    </span>
                    {entry.note ? <p>{entry.note}</p> : null}
                  </div>
                ))}

              <div className="item-actions">
                <label>
                  <span>Producidas ahora</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      updateDraft(item.id, {
                        production: Number(event.target.value),
                      })
                    }
                    type="number"
                    value={draft.production}
                  />
                </label>

                <label className="item-actions__note">
                  <span>Observacion</span>
                  <input
                    onChange={(event) =>
                      updateDraft(item.id, { note: event.target.value })
                    }
                    placeholder="Prueba, faltantes, comentario corto"
                    value={draft.note}
                  />
                </label>

                <button
                  className="button button--secondary"
                  onClick={() =>
                    onRecordProduction(
                      {
                        orderId: order.id,
                        orderItemId: item.id,
                        quantity: draft.production,
                        note: draft.note,
                      },
                      currentUser,
                    )
                  }
                  type="button"
                >
                  Registrar avance
                </button>
              </div>

              {currentUser.role === "admin" && onRecordDelivery ? (
                <div className="item-actions item-actions--delivery">
                  <label>
                    <span>Entregar</span>
                    <input
                      min="1"
                      onChange={(event) =>
                        updateDraft(item.id, {
                          delivery: Number(event.target.value),
                        })
                      }
                      type="number"
                      value={draft.delivery}
                    />
                  </label>
                  <button
                    className="button button--ghost"
                    onClick={() =>
                      onRecordDelivery({
                        orderId: order.id,
                        orderItemId: item.id,
                        quantity: draft.delivery,
                      })
                    }
                    type="button"
                  >
                    Registrar entrega parcial
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}

function formatOrderItems(
  order: AppOrder,
  productsById: Record<string, AppProduct>,
) {
  return order.items
    .map((item) => `${item.quantityOrdered} ${productsById[item.productId]?.code ?? "?"}`)
    .join(" - ");
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    en_produccion: "En produccion",
    parcial: "Parcial",
    terminado: "Terminado",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  return labels[status] ?? status;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateLike: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dateLike}T12:00:00`));
}

function formatDateTime(dateLike: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateLike));
}

export default App;
