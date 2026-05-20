import medscribeLogo from "../../assets/medscribe-logo.png";

interface ProductLogoProps {
  className?: string;
}

export function ProductLogo({ className = "" }: ProductLogoProps) {
  return (
    <span className={`product-logo ${className}`.trim()}>
      <img
        src={medscribeLogo}
        alt="MedScribe AI"
        className="product-logo-image"
      />
    </span>
  );
}

export default ProductLogo;
