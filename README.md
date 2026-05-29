# Nauticables

Base inicial para una PWA de gestion operativa:

- pedidos con fecha de entrega
- cola de produccion para operador
- caja ARS y caja USD
- cuentas a cobrar y pagar
- catalogo de productos completos y subcables

## Restriccion de costos

El proyecto esta pensado para mantenerse en costo cero en la fase inicial.

- usar solo Firebase `Spark` gratuito
- no asociar billing ni servicios pagos
- evitar OCR cloud, funciones pesadas y automatizaciones que puedan salir del plan gratis
- priorizar sincronizacion, offline y operacion diaria antes que features "inteligentes" costosas

## Por que esta estructura

El Excel actual tiene mucho valor, pero mezcla captura, formulas e historico en un mismo lugar. Esta base separa:

- catalogos
- pedidos
- produccion
- caja
- costos

## Modelo de productos

Un producto puede ser:

- `completo`: cable final vendible
- `subcable`: pieza fabricable que puede venderse sola o formar parte de un producto completo

Las recetas pueden incluir:

- `materiales`
- `otros productos`

Eso evita duplicar logica y refleja mejor como trabajan hoy.

## Comandos

```bash
npm install
npm run dev
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar credenciales de Firebase.

## Proximos pasos

1. Conectar Firebase real.
2. Crear login y alta de usuarios.
3. Implementar catalogos y pedidos.
4. Migrar historico del Excel.
