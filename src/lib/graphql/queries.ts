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
  }
`;

// Consulta liviana de "revisión": solo trae los timestamps que necesitamos
// para saber si algo cambió, sin ninguno de los campos anidados/pesados de
// GET_PROJECT_DATA. Pensada para pollear cada pocos segundos sin castigar al
// backend; GET_PROJECT_DATA completa solo se dispara cuando la revisión
// cambia (ver src/lib/polling y src/services/project.service.ts).
//
// NOTA: si `unit_types`/`units` resultan ser relaciones a content-types
// separados (en vez de componentes embebidos en `projects`), un cambio ahí
// podría no mover `projects.updatedAt`. Mientras eso no se confirme contra
// el schema real, el poller aplica además un "safety net" que fuerza una
// consulta completa cada N ciclos sin cambios detectados.
export const GET_PROJECT_REVISION = `
  query getProjectRevision($slug: String!) {
    projects(filters: { title: { eq: $slug } }) {
      updatedAt
    }
    floors {
      updatedAt
    }
  }
`;
