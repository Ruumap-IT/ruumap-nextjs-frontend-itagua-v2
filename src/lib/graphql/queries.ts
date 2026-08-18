// src/lib/graphql/queries.ts

export const GET_PROJECT_DATA = `
  query getProjectData($slug: String!) {
    projects(filters: { title: { eq: $slug } })  {
      title
      updatedAt
      subdomain
      show_price
      logo {
        url
      }
      welcome_video {
        url
      }
      brochure {
        url
      }
      address
      map_snapshot {
        url
      }
      address_interactive
      description
      contact_banner {
        url
      }
      social_networks {
        title
        icon {
          url
        }
        url
      }
      contact_channels {
        icon {
          url
        }
        value
        channel
      }
      flythroughs {
        viewpoint
        video {
          url
        }
        order
      }
      unit_types {
        title
        features {
          icon {
            url
          }
          label
          order
        }
        unit_type_documents {
          title
          document {
            url
          }
          order
        }
        units {
          title
          availability_status {
            code
            label
            color
            icon {
              url
            }
          }
          shape
          shape_viewbox
          centroid_point
          price
          floor {
            title
            level
            image {
              url
            }
          }
        }
        gallery {
          url
          caption
          alternativeText
          name
        }
        panoramic_view {
          url
        }
        floorplan_3d {
          url
        }
        floorplan_2d {
          url
        }
        tour_url
        video_url
        vr_url
        category
      }
      partnert {
        title
        address
        address_url
      }
    }
    floors {
      title
      level
      updatedAt
      image {
        url
      }
    }
    # Mismos campos raíz (livianos: solo documentId+updatedAt) que pide
    # GET_PROJECT_REVISION más abajo. Necesarios para que computeRevisionKey
    # calcule el mismo fingerprint sobre la respuesta de ESTA consulta que
    # sobre la de la revisión liviana — si no coincidieran en shape, el
    # "version" quedaría desincronizado y cada ciclo de polling creería que
    # cambió algo, disparando GET_PROJECT_DATA otra vez sin necesidad.
    unitTypes(filters: { project: { title: { eq: $slug } } }) {
      documentId
      updatedAt
    }
    units(filters: { unit_type: { project: { title: { eq: $slug } } } }) {
      documentId
      updatedAt
    }
    unitTypeDocuments(filters: { unit_type: { project: { title: { eq: $slug } } } }) {
      documentId
      updatedAt
    }
  }
`;

// Consulta liviana de "revisión": solo trae `documentId`+`updatedAt` de cada
// entidad relevante, sin ningún campo anidado/pesado de GET_PROJECT_DATA.
// Pensada para pollear cada pocos segundos sin castigar al backend;
// GET_PROJECT_DATA completa solo se dispara cuando la revisión cambia (ver
// src/lib/polling y src/services/project.service.ts).
//
// CONFIRMADO por introspección contra el schema real de Strapi (no es una
// suposición): `unit_types`/`units`/`unit_type_documents` son content-types
// independientes conectados por relación a `projects` — NO son componentes
// embebidos. Por eso `projects.updatedAt` NO se mueve cuando cambia el
// precio o la disponibilidad de una unidad, ni el título/categoría de una
// tipología: hace falta preguntarles su propio `updatedAt` directamente,
// filtrando por relación al proyecto (`unit_type: { project: { title: ... } }`).
// Medido en vivo: ~1.7s / ~7KB — sigue siendo ~2x más rápido y ~15x más
// liviano que GET_PROJECT_DATA (~3.5s / ~108KB).
//
// Gap conocido y documentado, NO cubierto por esta consulta: editar el
// contenido propio de un registro compartido (el color de un
// AvailabilityStatus, el ícono de un Feature) SIN reasignarlo a ninguna
// unidad/tipología. Ese caso solo se refleja vía el refresco de respaldo
// (ver FULL_REFRESH_SAFETY_NET_TICKS en ProjectDataProvider.tsx).
export const GET_PROJECT_REVISION = `
  query getProjectRevision($slug: String!) {
    projects(filters: { title: { eq: $slug } }) {
      updatedAt
    }
    floors {
      updatedAt
    }
    unitTypes(filters: { project: { title: { eq: $slug } } }) {
      documentId
      updatedAt
    }
    units(filters: { unit_type: { project: { title: { eq: $slug } } } }) {
      documentId
      updatedAt
    }
    unitTypeDocuments(filters: { unit_type: { project: { title: { eq: $slug } } } }) {
      documentId
      updatedAt
    }
  }
`;
