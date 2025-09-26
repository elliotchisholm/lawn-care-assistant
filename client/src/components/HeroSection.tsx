import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Calendar, Calculator } from "lucide-react";
import lawnBackgroundUrl from "@assets/generated_images/Clean_lawn_care_background_523c1df5.png";

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className = "" }: HeroSectionProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${lawnBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '280px'
      }}
      data-testid="hero-section"
    >
      <div className="relative z-10 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">NZLA Lawn Care Assistant</h1>
            <p className="text-white/90">Professional application guide & calculator</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white mb-1">Date-Based</h3>
              <p className="text-sm text-white/80">Automatic weekly recommendations</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white mb-1">Precise Scaling</h3>
              <p className="text-sm text-white/80">Quantities for your lawn size</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Leaf className="h-8 w-8 mx-auto mb-2 text-white" />
              <h3 className="font-semibold text-white mb-1">Professional</h3>
              <p className="text-sm text-white/80">NZLA certified application guide</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            Tank Mixing Guide
          </Badge>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            Application Timing
          </Badge>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            Year-Round Schedule
          </Badge>
        </div>
      </div>
    </div>
  );
}