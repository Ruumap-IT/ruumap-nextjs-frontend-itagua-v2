## 1. Registrar línea base (antes de tocar código)

- [ ] 1.1 En una carga fría de `/` (cache de navegador deshabilitada, Network tab abierto), registrar la cantidad de elementos `document.querySelectorAll('img[alt="preload-cache"]').length`. **Pendiente — requiere navegador real, ver "Resultado de la sesión de apply" al final de este archivo.**
- [x] 1.2 Registrar, por categoría (map_snapshot, contact_banner, planos de piso, amenities, tipologías/modelos), cuántas URLs distintas produce hoy `AssetPreloadProvider` — sin exponer credenciales ni el token de Strapi, solo cantidades y rutas relativas de imagen.
- [ ] 1.3 Registrar la cantidad de requests de imagen y los bytes transferidos de imágenes durante los primeros 5 segundos desde `/` (Network tab, filtro `Img`), en la misma ruta, mismo navegador, mismo perfil de red (sin throttling) y con caché deshabilitada. **Pendiente — requiere navegador real.**
- [ ] 1.4 Repetir 1.3 con throttling "Slow 3G" o equivalente, dejando constancia del perfil usado. **Pendiente — requiere navegador real.**
- [x] 1.5 Registrar el número real de pisos (`getAllFloors(project).length`), tipologías/familias de modelo distintas, y amenities incluidos hoy en la precarga, para poder explicar la magnitud del cambio en el resultado final.
- [x] 1.6 Guardar estas cifras (captura de Network tab o tabla simple) junto al resultado final del change — sin prometer un porcentaje de mejora antes de tener el número real.

## 2. Confirmar consumidores de las imágenes eliminadas

- [x] 2.1 Buscar en el repo otros lugares que puedan depender de que la primera foto de la galería de una tipología o de amenities ya esté precargada por `AssetPreloadProvider` (por ejemplo, miniaturas en sidebar, selectores de modelo, tarjetas de listado) — confirmar que `ResidencesContent.tsx` → `ZoomableImage.tsx` (y su reutilización en `AmenitiesClient.tsx`) es el único consumidor relevante y que ya tiene su propio fade/skeleton contextual.
- [x] 2.2 Confirmar que ningún otro archivo importa o depende directamente del array `criticalUrls` de `AssetPreloadProvider.tsx` (no debería, es estado interno del componente, pero se verifica antes de tocarlo).
- [x] 2.3 Dejar constancia explícita de que no se encontró ningún consumidor adicional, o documentar cuál se encontró y cómo se preservará su comportamiento.

## 3. Aplicar el cambio mínimo

- [x] 3.1 En `src/providers/AssetPreloadProvider.tsx`, eliminar el bloque que agrega la primera imagen de la galería de "Amenities" a `criticalUrls`.
- [x] 3.2 En el mismo archivo, eliminar el bloque que agrega la primera imagen de galería de cada familia/tipología de modelo a `criticalUrls`.
- [x] 3.3 Dejar sin modificar el bloque de `project.map_snapshot` y `project.contact_banner`.
- [x] 3.4 Dejar sin modificar el bloque que agrega todas las imágenes de piso vía `getAllFloors(project)`, incluyendo el uso de `priority` sobre esas imágenes.
- [x] 3.5 Revisar que no queden variables, imports o helpers sin uso en el archivo como resultado directo de 3.1-3.2 (limpieza estrictamente acotada a las líneas tocadas por este cambio, no una limpieza general del archivo).
- [x] 3.6 Confirmar con `git diff` que el único archivo modificado es `src/providers/AssetPreloadProvider.tsx`.

## 4. Ejecutar validaciones técnicas

- [x] 4.1 Ejecutar `npm run build` (o el script de build del proyecto) y confirmar que compila sin errores nuevos.
- [x] 4.2 Ejecutar `npm run lint` (o `eslint`) y confirmar que no se introducen errores/warnings nuevos en `AssetPreloadProvider.tsx` — no se corrige deuda de lint preexistente fuera de este archivo ni fuera de las líneas tocadas.
- [x] 4.3 Confirmar con TypeScript (parte del build) que no quedan tipos o referencias rotas tras el recorte.

## 5. Ejecutar pruebas manuales de continuidad

- [ ] 5.1 Flujo completo: `/` → splash → ENTRAR → `/project` (edificio) → girar → `/floor-plans` — confirmar que el comportamiento visual es idéntico al de antes del cambio. **Pendiente — requiere navegador real, ver instrucciones al final.**
- [ ] 5.2 En `/floor-plans`, cambiar de piso repetidamente entre varios pisos ya visitados y no visitados — confirmar que no reaparece el fade/espera que `AssetImage.tsx` documenta como regresión ya corregida. **Pendiente — requiere navegador real.**
- [ ] 5.3 Navegación en frío (refresh directo, sesión nueva) a una ruta de departamento (`/departments/[model]`) de una tipología nunca antes vista en la sesión — confirmar que la galería aparece vía el fade/skeleton contextual existente, sin pantalla blanca, negra ni vacía, y sin bloqueo de interacción. **Pendiente — requiere navegador real.**
- [ ] 5.4 Navegación en frío a una ruta de amenity (`/amenities/[model]`) nunca antes vista en la sesión — misma verificación que 5.3. **Pendiente — requiere navegador real.**
- [ ] 5.5 Repetir 5.3 y 5.4 con caché del navegador deshabilitada y con throttling de red limitado ("Slow 3G" o equivalente), confirmando que un fallo o demora de una imagen individual no bloquea el resto del showroom. **Pendiente — requiere navegador real.**
- [ ] 5.6 Confirmar que ningún video, transición de video, ruta, redirect o comportamiento de `ViewTransition`/`ProjectDataProvider`/polling cambió respecto al comportamiento anterior al change (verificación de que el alcance no se filtró fuera de lo documentado). **Parcialmente cubierto por `git diff` (solo un archivo tocado); la verificación visual/funcional en navegador queda pendiente.**

## 6. Registrar comparación antes/después

- [ ] 6.1 Repetir exactamente las mediciones de la sección 1 (mismos pasos 1.1-1.4) sobre el código ya modificado, en la misma ruta, mismo navegador, mismo estado de caché y mismo perfil de red que la línea base. **Parcial: 1.2/1.5 (datos de Strapi) recalculados y estables; 1.1/1.3/1.4 (navegador) pendientes.**
- [x] 6.2 Confirmar que la reducción de elementos `img[alt="preload-cache"]` y de requests coincide exactamente con la cantidad de imágenes de amenities + tipologías retiradas (ni más ni menos). *(Confirmado por análisis de código + datos reales, no por conteo en DOM — ver detalle abajo.)*
- [x] 6.3 Confirmar que la cantidad de elementos/requests correspondientes a map_snapshot, contact_banner y planos de piso no cambió. *(Confirmado: esas líneas de código no fueron tocadas — `git diff` lo prueba.)*
- [ ] 6.4 Documentar la comparación de bytes transferidos y, si es medible de forma razonable, una estimación de memoria decodificada antes/después. **Pendiente — requiere navegador real; sin esa medición no se cuantifican bytes/memoria, solo la cantidad de elementos.**

## 7. Preparar rollback y resumen del resultado

- [x] 7.1 Confirmar que el cambio queda contenido en un único commit que toca únicamente `src/providers/AssetPreloadProvider.tsx`. **Parcialmente distinto a lo planeado: el diff funcional en `AssetPreloadProvider.tsx` SÍ quedó exactamente como se implementó (confirmado byte a byte), pero terminó dentro de un commit (`d729ea6`, autor `dannnmr`, no creado por la sesión de apply) que también incluye `.claude/`, `openspec/config.yaml`, los tres artefactos de este change y `public/sw.js`. No es un commit de un solo archivo. Ver "Verificación de cierre" más abajo.**
- [x] 7.2 Documentar la estrategia de rollback (revert del commit) en el resumen final del change.
- [x] 7.3 Escribir un resumen final con: línea base, resultado medido, confirmación de los criterios de aceptación del proposal, y confirmación explícita de que no se tocó ningún archivo de video, datos, seguridad, PWA o rutas.

---

## Resultado de la sesión de apply (2026-08-14)

**Estado inicial del repo (antes de tocar código):** `git status --short` mostraba `M public/sw.js` (artefacto de build regenerado por Serwist en una sesión anterior de auditoría, no relacionado con este change y no tocado en esta sesión), `?? .claude/` y `?? openspec/` (directorios ya existentes de la sesión previa). Ningún cambio ajeno fue sobrescrito.

**Línea base real (tarea 1.2 / 1.5)** — obtenida con una consulta GraphQL de solo lectura contra el endpoint de Strapi de producción, usando el token únicamente en memoria (nunca impreso ni registrado en ningún archivo):

| Categoría | Cantidad real | Contribuye hoy a `criticalUrls` |
|---|---|---|
| `map_snapshot` | 1 | Sí — se mantiene |
| `contact_banner` | 1 | Sí — se mantiene |
| Planos de piso (`floors`, todos con `image.url`) | 48 | Sí — se mantiene, sin cambios |
| Amenities (`unit_types` cuyo título contiene "Amenities") | 2 (`Amenities Piso 1`, `Amenities Piso 12`) | **No, ya contribuía 0 antes del cambio** — ver hallazgo abajo |
| Modelos/tipologías distintas con galería | 13 (`Modelo A IT` … `Modelo K IT`) | Sí, 13 imágenes — **se retiran con este cambio** |

**Hallazgo no solicitado, documentado por transparencia (no corregido, fuera de alcance):** el bloque de "Foto 1 de Amenities" que existía en el código comparaba `normalizeUnitTitle(ut.title).toUpperCase() === "AMENITIES"` (igualdad estricta). Los `unit_types` reales de este proyecto se llaman `"Amenities Piso 1"` y `"Amenities Piso 12"`, que `normalizeUnitTitle` no reduce a `"AMENITIES"` (no hay regla que quite el sufijo "Piso N"). Es decir: **el bloque de Amenities ya no aportaba ninguna imagen a la precarga antes de este change**, para los datos reales de este proyecto. No se tocó esa lógica de comparación — sigue existiendo la misma condición en el historial de git, y este hallazgo no forma parte del alcance de `reduce-hidden-image-preload-scope`. Se deja registrado para quien decida si vale la pena un change aparte.

**Total antes:** 1 + 1 + 48 + 0 + 13 = **63 imágenes ocultas** (asumiendo, razonablemente, que ninguna URL de plano coincide con una de galería de modelo — no hay evidencia de colisión en las rutas de CDN observadas).
**Total después del cambio:** 1 + 1 + 48 = **50 imágenes ocultas**.
**Reducción:** **13 imágenes (≈ 20.6% del conjunto de precarga oculta)** — coincide exactamente con las 13 imágenes de tipología retiradas (0 de Amenities, porque ya no aportaba ninguna). Confirma la advertencia del propio change: la mejora es moderada porque los planos de piso (48 de 63, ~76% del total) dominan el conjunto y no se tocaron.

**Pendiente de medición real (requiere navegador, no ejecutable desde este entorno):**
- Conteo exacto de `document.querySelectorAll('img[alt="preload-cache"]').length` antes/después (el número de 63→50 de arriba es un cálculo a partir de datos reales de Strapi + la lógica de código, no una lectura de DOM).
- Requests y bytes transferidos de imágenes en los primeros 5s desde `/`, con y sin throttling "Slow 3G".
- Estimación de memoria decodificada antes/después.
- Las seis pruebas manuales de continuidad de la sección 5 (splash → edificio → planos; cambio repetido de piso; entrada en frío a un departamento/amenity nunca visto; comportamiento con caché deshabilitada y red limitada).

**Cómo medir lo pendiente:**
1. `pnpm run start` (o `pnpm run dev`) y abrir `http://localhost:8475/` (puerto configurado en `package.json`) en Chrome/Edge con DevTools.
2. Network tab → deshabilitar caché → recargar en frío → filtrar por `Img` → anotar cantidad de requests y "Transferred"/"Resource size" de la columna, en los primeros 5s.
3. Repetir con el ícono de throttling en "Slow 3G".
4. En la consola: `document.querySelectorAll('img[alt="preload-cache"]').length`.
5. Navegar manualmente el flujo de la sección 5 de este archivo y confirmar visualmente cada punto.
6. Repetir todo lo anterior contra el commit anterior a este cambio (`git stash` o checkout de la versión previa de `AssetPreloadProvider.tsx`) para tener el "antes" real de DOM/red, si no se guardó ya esa captura antes de aplicar el cambio.

**Verificación técnica automatizada ejecutada en esta sesión (no reemplaza las pruebas manuales):**
- `pnpm run build`: compiló sin errores, TypeScript sin errores, mismo mapa de rutas que antes del cambio.
- `pnpm run start` en background, puerto 8475: `/`, `/project`, `/floor-plans`, `/amenities`, `/departments`, `/video`, `/location`, `/contact` respondieron `200` (smoke test de disponibilidad de rutas, no de contenido visual). Servidor detenido al finalizar.
- `curl` sobre el HTML de `/` sin JavaScript confirmó 0 apariciones de `alt="preload-cache"` en el HTML servido por el servidor — esperado, porque `criticalUrls` arranca vacío y se llena client-side en un `useEffect` una vez hay datos del proyecto; por eso el conteo real de imágenes ocultas no puede obtenerse sin ejecutar JavaScript en un navegador real.
- `npx eslint src/providers/AssetPreloadProvider.tsx`: 1 error preexistente (`react-hooks/set-state-in-effect` sobre el `setCriticalUrls` dentro del `useEffect`, ahora en la línea 59). Este mismo error, sobre la misma línea de código, ya existía antes del cambio (estaba en la línea 71 del archivo original, documentado en la auditoría previa de este repo) — no es un error nuevo introducido por este change, y no se corrigió, según el alcance acordado.

**Rollback.** No se hizo commit en esta sesión. El cambio vive únicamente en el working tree, acotado a `src/providers/AssetPreloadProvider.tsx` (confirmado con `git diff`). Para deshacerlo ahora mismo: `git checkout -- src/providers/AssetPreloadProvider.tsx`. Una vez que el equipo decida commitear este diff, la estrategia de rollback pasa a ser `git revert <sha-del-commit>`, que restaura el archivo a su estado anterior sin efectos secundarios (es el único archivo tocado).

**Confirmación de alcance.** `git diff` (ver sección 3.6) muestra un único archivo modificado: `src/providers/AssetPreloadProvider.tsx`. No se tocó ningún archivo de video, `AdoptedVideo`, contextos de video, splash/timers, rutas/redirects, `ViewTransition`, `ProjectDataProvider`/polling, variables de entorno, PWA/Serwist/offline, `ZoomableImage`, `AssetImage`, `FloorViewer`, `FloorPlanOverlay`, configuración de lint/tests, ni ningún otro archivo de la aplicación. `public/sw.js` figura como modificado en `git status`, pero es un artefacto de build regenerado por una sesión de auditoría previa a este change (y vuelto a regenerar por el propio `pnpm run build` de la tarea 4.1) — no fue editado a mano y no forma parte del diff funcional de este change.

---

## Verificación de cierre técnico (sesión posterior, mismo día)

**Hallazgo importante: apareció un commit que no fue creado por ninguna sesión de apply.**

```
commit d729ea6b27849ffcfa45e1d3f5a58cdbaad1c3e2
author: dannnmr <134517820+dannnmr@users.noreply.github.com>
date:   Fri Aug 14 15:32:32 2026 -0400
message: improve itagua
```

Entre el cierre de la sesión de apply (working tree con un único archivo modificado, sin commitear) y esta sesión de verificación, `git status --short` pasó a estar vacío y `git log` muestra este commit nuevo, con la identidad de autor del dueño del repositorio — es decir, no fue generado por ninguna de las dos sesiones de Claude Code, sino desde fuera (editor/panel de control de versiones). El commit incluye, todo junto: `.claude/commands/`, `.claude/skills/`, `openspec/config.yaml`, los tres artefactos de `reduce-hidden-image-preload-scope` (`proposal.md`, `specs/hidden-image-preload/spec.md`, `tasks.md`), `public/sw.js`, y `src/providers/AssetPreloadProvider.tsx`.

Se verificó con `git diff c4c7ae8 d729ea6 -- src/providers/AssetPreloadProvider.tsx` que el contenido del cambio funcional dentro de ese commit es **idéntico, línea por línea**, al implementado y validado en la sesión de apply — no hay contenido adicional ni distinto.

**Consecuencia sobre el rollback documentado arriba:** la estrategia "`git revert` de un commit que toca un solo archivo" ya no es literalmente así — `git revert d729ea6` deshace *todo* lo que entró en ese commit (incluida la configuración de OpenSpec y los comandos `.claude/`), no solo el cambio de `AssetPreloadProvider.tsx`. Si en algún momento hace falta revertir *solo* el cambio funcional sin tocar lo demás, la vía correcta es un revert parcial: `git checkout d729ea6~1 -- src/providers/AssetPreloadProvider.tsx` seguido de un commit nuevo, no un `git revert` liso del commit completo.

**Re-ejecución de las verificaciones técnicas (mismos resultados que en la sesión de apply):**
- `git diff --check` (working tree y sobre el rango `c4c7ae8..d729ea6` acotado al archivo): sin errores de espacios en blanco, exit code 0.
- `openspec validate reduce-hidden-image-preload-scope --strict`: **válido**.
- `pnpm build`: compiló sin errores, TypeScript sin errores, mismo mapa de rutas. Como efecto esperado de correr el build de nuevo, `public/sw.js` volvió a aparecer como modificado en `git status` (Serwist regenera ese archivo en cada build) — no se tocó a mano y sigue fuera del alcance de este change.
- `npx eslint src/providers/AssetPreloadProvider.tsx`: mismo único error preexistente (`react-hooks/set-state-in-effect`, línea 59), sin cambios.
- Búsqueda de `urls.add(` en el archivo: exactamente 3 apariciones — `project.map_snapshot.url` (línea 39), `project.contact_banner.url` (línea 40), `f.image.url` dentro del `forEach` sobre `getAllFloors(project)` (línea 46). El campo real del tipo `Floor` es `image` (`src/types/index.ts:57`), no `plan_image` — mismo campo, nombre exacto distinto al mencionado informalmente. No hay ninguna cuarta vía por la que `criticalUrls` pueda recibir una URL de amenities o de modelo.
