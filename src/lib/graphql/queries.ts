// src/lib/graphql/queries.ts

export const GET_PROJECT_DATA = `
  query getProjectData($slug: String!) {
    projects(filters: { title: { eq: $slug } })  {
      title
      subdomain
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
      image {
        url
      }
    }
  }
`;
