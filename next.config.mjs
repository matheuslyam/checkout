/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    ASAAS_API_KEY_INTERNAL: '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFlNDU2YzYxLTVlZjgtNGQwZS05MjI2LWYwNmVkNGI2YWZiNTo6JGFhY2hfZmI3ZjZlZjgtMmVjMC00MTdjLWJhODQtNDUxMDFjYzM3ZWY5',
    ASAAS_API_KEY: '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFlNDU2YzYxLTVlZjgtNGQwZS05MjI2LWYwNmVkNGI2YWZiNTo6JGFhY2hfZmI3ZjZlZjgtMmVjMC00MTdjLWJhODQtNDUxMDFjYzM3ZWY5'
  }
}

export default nextConfig
