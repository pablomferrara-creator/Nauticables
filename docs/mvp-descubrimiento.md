# Nauticables: MVP Web App

## Objetivo

Construir una web app responsive tipo PWA para usar desde iPhone, Android y PC, con soporte offline y sincronizacion posterior, que reemplace gradualmente el Google Sheet actual sin perder el historico.

## Restriccion no negociable

La solucion inicial debe mantenerse en plataformas gratuitas.

- Firebase solo en plan `Spark`
- sin billing asociado
- sin funciones o servicios externos que puedan generar cargos
- cualquier funcionalidad futura que ponga en riesgo eso debe evaluarse antes de implementarse

## Lo que hoy resuelve el Excel

Del analisis del archivo `Cable Astilleros v18.xlsm` se desprende esta estructura funcional:

- `Plan 20xx`: pedidos por astillero/modelo, cantidades por mes, precios de venta y facturacion estimada.
- `Lista de Materiales`: catalogo maestro de insumos, precio actual, precios anteriores, proveedor y variacion.
- `Balance`: movimientos de caja, ingresos, egresos, extracciones, cobros pendientes y cierres manuales.
- `Pagos MO`: tarifas por unidad y calculo de pagos a operadores.
- `Astilleros`: base de clientes/contactos y observaciones comerciales.
- `Costo ...` y hojas de productos: recetas/BOM y costo de produccion por modelo.

## Problemas a no heredar

- La misma hoja mezcla datos operativos, formulas, historico y reportes.
- Los pedidos viven en formato agregado por mes, pero la operacion real necesita pedidos individuales, parciales y con fecha de entrega.
- La caja mezcla movimientos, pendientes y cierres en una sola tabla.
- Los productos y sus costos estan repartidos en decenas de hojas, lo que vuelve dificil buscar, versionar y auditar.
- El operario necesita una vista mucho mas simple que la estructura del Excel.

## Propuesta de fase 1

No conviene arrancar por "clonar el Excel en HTML". Conviene una PWA con Firebase y un modelo de datos propio.

### Stack recomendado

- Frontend: React + Vite
- UI mobile-first: componentes simples y formularios rapidos
- App installable: PWA
- Backend: Firebase
- Base de datos: Firestore
- Auth: Firebase Authentication
- Roles: `admin` y `operador`
- Storage: Firebase Storage para fotos de remitos mas adelante

## Alcance del MVP

### 1. Usuarios y permisos

- `admin`: vos y tu socio
- `operador`: ve pedidos asignados o pendientes, marca produccion, informa cantidades reales y observaciones

### 2. Pedidos

- alta manual rapida desde celular
- cliente/astillero
- fecha de pedido
- fecha de entrega
- items del pedido
- estado: `pendiente`, `en_produccion`, `parcial`, `terminado`, `entregado`, `cancelado`
- entregas parciales
- observaciones

### 3. Produccion

- vista simple para operario
- cola ordenada por fecha de entrega
- carga de cantidades producidas reales
- observaciones de taller
- trazabilidad de quien marco cada cambio

### 4. Caja

- ingresos y egresos
- cuentas a cobrar
- cuentas a pagar
- cierre de caja
- movimientos en pesos y opcion preparada para dolares
- anulacion logica en vez de borrado

### 5. Importacion historica

- importar clientes
- importar catalogo de productos
- importar lista de materiales
- importar recetas/BOM
- importar balance historico
- importar planes historicos como base analitica

## Lo que conviene dejar para fase 2

- OCR de remitos desde foto
- actualizacion automatica de costos desde remitos/facturas
- planificacion de materiales segun pedidos abiertos
- liquidacion avanzada de mano de obra
- dashboards de comparativa anual y rentabilidad mas profundos

## Modelo de datos inicial

### users

- uid
- nombre
- email
- role: `admin` | `operador`
- active

### shipyards

- id
- nombre
- zona
- direccion
- contactoCompras
- telefono1
- telefono2
- email1
- email2
- notas
- active

### products

- id
- codigo
- nombre
- aliasBusqueda
- unidadMO
- precioVentaActual
- active

### productRecipes

- id
- productId
- version
- materialId
- cantidad
- observacion
- active

### materials

- id
- nombre
- proveedorPrincipal
- precioActual
- moneda
- active

### materialPriceHistory

- id
- materialId
- fecha
- precio
- proveedor
- fuente

### orders

- id
- shipyardId
- fechaPedido
- fechaEntrega
- estado
- notasCliente
- notasInternas
- createdBy
- updatedBy

### orderItems

- id
- orderId
- productId
- descripcionLibre
- cantidadPedida
- cantidadTerminada
- cantidadEntregada

### productionLogs

- id
- orderItemId
- fecha
- cantidad
- tipo: `inicio` | `avance` | `terminado` | `ajuste`
- observacion
- createdBy

### cashMovements

- id
- fecha
- tipo: `ingreso` | `egreso` | `extraccion`
- categoria
- concepto
- monto
- moneda
- estado: `confirmado` | `pendiente` | `anulado`
- linkedEntityType
- linkedEntityId
- createdBy

### receivables

- id
- shipyardId
- fechaOrigen
- fechaVencimiento
- concepto
- montoTotal
- montoCobrado
- estado

### payables

- id
- proveedorONombre
- fechaOrigen
- fechaVencimiento
- concepto
- montoTotal
- montoPagado
- estado

### cashClosures

- id
- fecha
- saldoCalculado
- saldoDeclarado
- diferencia
- observaciones
- createdBy

### wageRates

- id
- productId
- valorPorUnidad
- vigenciaDesde

## Importacion del Excel

No se debe importar "como se ve". Se debe importar "como significa".

### Estrategia

1. Catalogar productos unicos.
2. Catalogar astilleros/clientes.
3. Migrar materiales y proveedores.
4. Transformar hojas `Costo...` y hojas de producto en recetas normalizadas.
5. Transformar `Balance` en movimientos, cuentas a cobrar/pagar y cierres.
6. Transformar `Plan 2023-2026` en historico analitico.
7. Crear pedidos nuevos ya en el sistema, no en el sheet.

## Flujos importantes

### Carga de pedido

El pedido puede arrancar desde texto libre:

- `te encargo 2 juegos de 285`
- `Cuando puedas haceme 2 180 y 2 150 eco`
- `Necesito un K2400 para la semana que viene`

La primera version no deberia depender de interpretar ese texto automaticamente. Mejor:

- elegir astillero
- elegir fecha de entrega
- cargar items con buscador de productos y cantidad
- guardar rapido

Despues se puede agregar sugerencia automatica a partir del texto.

### Operario

Debe poder:

- ver pedidos pendientes
- filtrar por urgencia
- ver fecha de entrega
- cargar cantidades producidas
- marcar parcial o terminado
- agregar observaciones

No debe poder:

- ver caja
- ver costos sensibles
- editar catalogos

## Criterios de diseno

- mobile-first real, no "desktop adaptado"
- formularios cortos
- acciones frecuentes en uno o dos toques
- historial de cambios
- anulacion en vez de borrado
- offline y sincronizacion posterior

## Preguntas abiertas antes de construir

1. Como definimos el catalogo maestro de productos para los pedidos: por nombre comercial, codigo corto, o ambos.
2. Si un pedido puede tener items "libres" que todavia no existan en catalogo.
3. Como queres manejar dolares cuando aparezcan: caja separada o solo registrar moneda del movimiento.
4. Si los pedidos deben poder asignarse explicitamente a un operador.
5. Si queres registrar entregas con numero de remito en la fase 1.
6. Si los cobros pendientes nacen manualmente o automaticamente al marcar una entrega/factura.

## Orden sugerido de construccion

1. Base del proyecto y autenticacion.
2. Catalogos: usuarios, astilleros, productos.
3. Pedidos y tablero de produccion.
4. Caja, cuentas a cobrar/pagar y cierre.
5. Importador historico desde Excel.
6. Reportes y comparativas.
