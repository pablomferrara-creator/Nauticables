import { appHighlights, cashAccounts, sampleBoard, sampleProducts } from "./data/mockData";

function App() {
  return (
    <div className="shell">
      <header className="hero">
        <div className="hero__eyebrow">Nauticables / Operacion diaria</div>
        <div className="hero__content">
          <div>
            <h1>Pedidos, produccion y caja en una sola base ordenada.</h1>
            <p>
              Esta base ya contempla productos completos, subcables, cuentas en
              ARS y USD, y una experiencia mobile-first para ustedes y el
              operador.
            </p>
          </div>
          <div className="hero__panel">
            <span className="pill pill--accent">Fase 1</span>
            <strong>Web app instalable</strong>
            <span>iPhone + Android + PC</span>
            <span>Funciona offline y sincroniza despues</span>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="section">
          <div className="section__header">
            <h2>Prioridades del MVP</h2>
            <p>
              Arrancamos por lo que hoy mas friccion genera en el trabajo real.
            </p>
          </div>
          <div className="grid grid--three">
            {appHighlights.map((item) => (
              <article key={item.title} className="card">
                <span className="pill">{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <h2>Catalogo de productos</h2>
            <p>
              Un producto puede ser un cable completo o un subcable fabricable.
            </p>
          </div>
          <div className="grid">
            {sampleProducts.map((product) => (
              <article key={product.code} className="card card--product">
                <div className="card__row">
                  <h3>{product.code}</h3>
                  <span className="pill">{product.kind}</span>
                </div>
                <strong>{product.name}</strong>
                <p>{product.summary}</p>
                <div className="chips">
                  {product.components.map((component) => (
                    <span key={component} className="chip">
                      {component}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--split">
          <article className="card">
            <div className="section__header">
              <h2>Cola de produccion</h2>
              <p>
                La vista del operador va a ser breve, urgente y con muy pocos
                toques.
              </p>
            </div>
            <div className="list">
              {sampleBoard.map((job) => (
                <div key={job.client + job.product} className="list__item">
                  <div>
                    <strong>{job.product}</strong>
                    <span>{job.client}</span>
                  </div>
                  <div>
                    <span>{job.dueLabel}</span>
                    <strong>{job.qty}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="section__header">
              <h2>Caja separada por moneda</h2>
              <p>
                Preparamos ARS y USD como cajas distintas para no mezclar saldo
                operativo con ahorro o retiros.
              </p>
            </div>
            <div className="list">
              {cashAccounts.map((account) => (
                <div key={account.name} className="list__item">
                  <div>
                    <strong>{account.name}</strong>
                    <span>{account.purpose}</span>
                  </div>
                  <div>
                    <span>{account.currency}</span>
                    <strong>{account.example}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;

