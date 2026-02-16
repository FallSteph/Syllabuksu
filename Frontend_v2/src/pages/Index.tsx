import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    let to = "/dashboard";
    try {
      const last = localStorage.getItem('last_path');
      if (last && typeof last === 'string' && last !== '/' && !last.startsWith('/login')) {
        to = last;
      }
    } catch {}
    return <Navigate to={to} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Logo size="md" className="[&_span]:text-primary-foreground [&_div]:bg-primary-foreground/20" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>

        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            AI-Driven Syllabus<br />Tracking & Digital Signing
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Streamline your academic workflow with intelligent syllabus management, automated approval workflows, and secure digital signatures.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/signup">Start Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-primary-foreground/30 text-gray-700 hover:bg-primary-foreground/10">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">Why Choose Syllabo?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: BookOpen, title: 'Smart Tracking', desc: 'Real-time visibility into your syllabus approval status across all review stages.' },
            { icon: Shield, title: 'Secure Workflow', desc: 'Role-based access ensures only authorized reviewers can approve submissions.' },
            { icon: Clock, title: 'Fast Approvals', desc: 'Automated notifications and streamlined process reduce approval time by 60%.' },
          ].map((f, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border shadow-soft">
              <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Syllabo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
