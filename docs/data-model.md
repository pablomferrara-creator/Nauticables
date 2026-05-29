# Modelo de datos inicial

## Productos

La app no debe tratar a `K180 completo` y `Ficha A y B K180` como simples nombres parecidos. Son dos productos distintos:

- uno es un producto final vendible
- el otro es un subcable fabricable y tambien vendible en algunos casos

Por eso el modelo propuesto usa:

- `products`
- `recipeVersions`
- `recipeComponents`

Cada componente de receta puede apuntar a:

- un `material`
- otro `product`

Esto permite:

- costear un cable completo sumando subcables y materiales directos
- vender un subcable solo sin inventar un producto paralelo
- versionar recetas si cambia la fabricacion

## Caja

La caja se separa por cuenta:

- `Caja ARS`
- `Caja USD`

Cada movimiento conoce a que cuenta pertenece. Asi:

- no se mezclan monedas
- el cierre de cada caja es independiente
- se puede registrar retiro en USD sin afectar la caja ARS

## Pedidos

El pedido es individual y no mensual agregado. Eso es clave para operar mejor que en el Excel.

### orders

- cliente
- fecha de pedido
- fecha de entrega
- estado general
- notas

### orderItems

- producto
- cantidad pedida
- cantidad producida
- cantidad entregada

### productionLogs

- avances reales del operador
- observaciones
- trazabilidad

## Migracion del Excel

La idea no es copiar pestañas. La idea es traducir el significado:

- `Plan 2023-2026` pasa a historico analitico
- `Balance` pasa a movimientos, cierres, cuentas a cobrar y pagar
- `Lista de Materiales` pasa a catalogo de materiales e historial de precios
- hojas `Costo ...` y hojas de producto pasan a recetas
