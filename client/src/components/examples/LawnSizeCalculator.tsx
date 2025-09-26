import LawnSizeCalculator from '../LawnSizeCalculator';

export default function LawnSizeCalculatorExample() {
  return (
    <LawnSizeCalculator 
      currentSize={100} 
      onSizeChange={(size) => console.log('Lawn size changed to:', size)} 
    />
  );
}