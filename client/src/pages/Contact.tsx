import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function Contact() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(data);
    toast.success("Mensagem enviada com sucesso!");
    reset();
  };

  return (
    <div className="space-y-12 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-mono tracking-tight">
          <span className="text-primary">/</span>contato
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Tem um projeto em mente ou quer conversar? Estou aberto a novas oportunidades.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-mono text-muted-foreground">Nome</label>
                <Input 
                  id="name" 
                  {...register("name", { required: true })}
                  className="bg-card border-border focus:border-primary font-mono rounded-none" 
                  placeholder="Seu nome" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-mono text-muted-foreground">Email</label>
                <Input 
                  id="email" 
                  type="email"
                  {...register("email", { required: true })}
                  className="bg-card border-border focus:border-primary font-mono rounded-none" 
                  placeholder="voce@exemplo.com" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-mono text-muted-foreground">Assunto</label>
              <Input 
                id="subject" 
                {...register("subject", { required: true })}
                className="bg-card border-border focus:border-primary font-mono rounded-none" 
                placeholder="Proposta de projeto" 
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-mono text-muted-foreground">Mensagem</label>
              <Textarea 
                id="message" 
                {...register("message", { required: true })}
                className="min-h-[150px] bg-card border-border focus:border-primary font-mono rounded-none resize-none" 
                placeholder="Conte sobre o seu projeto..." 
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-mono rounded-none"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Enviar mensagem <Send className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-8 lg:pl-12 border-l border-border/50">
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-mono">Informações de contato</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground">Email</p>
                  <a href="mailto:frotamht@gmail.com" className="hover:text-primary transition-colors">frotamht@gmail.com</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded text-primary">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground">WhatsApp</p>
                  <a href="https://wa.me/5585996370080" className="hover:text-primary transition-colors">(85) 99637-0080</a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border border-primary/20 bg-primary/5 rounded-none">
            <h4 className="font-mono font-bold text-primary mb-2">Baixar currículo</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Um resumo da minha experiência, formação e habilidades técnicas.
            </p>
            <Button variant="outline" className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground font-mono rounded-none">
              Baixar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
