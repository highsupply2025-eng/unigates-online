# Architecture rules
- The cloud rental homepage uses dedicated components and scoped semantic theme tokens so institutional dashboards retain their existing design.
- The homepage explainer uses a CDN asset pointer resolved against the primary public origin so media loads in both local preview and published pages.
- Retired standalone platform entry routes redirect to the rental homepage; existing account dashboards and institution registration routes stay intact to preserve access and data.