import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://unigates.online";

interface SEOProps {
  title: string;
  description: string;
  ogType?: "website" | "article";
  jsonLd?: object | object[];
  image?: string;
}

const SEO = ({ title, description, ogType = "website", jsonLd, image }: SEOProps) => {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname}`;
  const img = image ?? `${SITE_URL}/og-logo.png`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
