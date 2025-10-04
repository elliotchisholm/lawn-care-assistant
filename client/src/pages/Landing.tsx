import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Leaf, Calendar, ShoppingCart, BarChart3, ExternalLink } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header with links */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-end gap-2">
            <a
              href="https://www.newzealandlawnaddicts.com/application-guide"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-nzla-external"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2"
              >
                NZLA Guide
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Leaf className="h-12 w-12 text-green-600" />
            <h1 className="text-4xl font-bold text-green-800">NZLA Lawn Care Manager</h1>
          </div>
          <p className="text-xl text-green-700 mb-8 max-w-2xl mx-auto">
            Your comprehensive lawn care assistant with personalized NZLA product recommendations, 
            inventory tracking, and purchase planning.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3"
            data-testid="button-login"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Log In with Google
          </Button>
        </div>

        {/* Attribution Banner */}
        <div className="bg-white/80 backdrop-blur border border-green-200 rounded-lg p-4 mb-12 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-green-900">
                <strong>Content Source:</strong> All application calculations, product recommendations, and guidance are based on the{" "}
                <a 
                  href="https://www.newzealandlawnaddicts.com/application-guide" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 underline hover:no-underline font-medium"
                  data-testid="link-nzla-guide"
                >
                  New Zealand Lawn Addicts Application Guide
                </a>
                .
              </p>
              <p className="text-green-700 mt-1">
                The application guide and its content are the intellectual property of New Zealand Lawn Addicts. This tool provides calculations and tracking based on their guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                Get personalized weekly application recommendations based on the current date and season.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• NZLA-certified product recommendations</li>
                <li>• Scaled quantities for your lawn size</li>
                <li>• Tank mixing instructions</li>
                <li>• Application timing guidance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Inventory Tracking
              </CardTitle>
              <CardDescription>
                Track your current product stocks and monitor inventory levels in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Current stock monitoring</li>
                <li>• Stock sufficiency indicators</li>
                <li>• Purchase date tracking</li>
                <li>• Personal notes for each product</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Purchase Recommendations
              </CardTitle>
              <CardDescription>
                Never run out of products with intelligent purchase planning and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 8-week application forecasting</li>
                <li>• Automatic purchase alerts</li>
                <li>• Suggested quantities with buffers</li>
                <li>• Stock depletion warnings</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="text-center bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Why Choose NZLA Lawn Care Manager?</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge variant="secondary" className="text-green-700 bg-green-100">Professional Grade</Badge>
            <Badge variant="secondary" className="text-green-700 bg-green-100">NZLA Certified</Badge>
            <Badge variant="secondary" className="text-green-700 bg-green-100">Personalized</Badge>
            <Badge variant="secondary" className="text-green-700 bg-green-100">Easy to Use</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Based on professional lawn care guidelines from the New Zealand Lawn Association, 
            our system provides expert-level recommendations tailored to your specific lawn size and seasonal needs.
          </p>
          <Button 
            onClick={handleLogin} 
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-login-footer"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}