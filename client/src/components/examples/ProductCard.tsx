import ProductCard from '../ProductCard';

const mockProducts = [
  { name: "NZLA Nurture", quantity: 400, unit: "ml", type: "liquid" as const },
  { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" as const },
  { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" as const },
  { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" as const }
];

export default function ProductCardExample() {
  return (
    <ProductCard 
      products={mockProducts}
      waterVolume={5}
      lawnSize={150}
      applicationNotes="Apply to dry foliage. Follow with 15-20mm of irrigation the following day."
    />
  );
}