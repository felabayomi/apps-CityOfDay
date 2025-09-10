import { Plane } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🌍</span>
            <p className="text-foreground font-medium">
              City Discoverer partners with <strong>Expedia</strong>, <strong>Viator</strong>, and <strong>Global Travel</strong> to bring you insider access and exclusive deals.
            </p>
          </div>
          
          <p className="text-muted-foreground mb-4">
            We link to official sources for accuracy, but for <strong className="text-foreground">best rates & curated packages, contact us directly.</strong>
          </p>
          
          <div className="flex items-center justify-center gap-2 text-primary mb-6">
            <span>Your next adventure could start here.</span>
            <Plane className="w-5 h-5" />
          </div>

          <div className="border-t border-muted pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 City Discoverer, An Expedition America LLC Co.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <a href="https://citydiscoverer.ai/contact" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Contact
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}