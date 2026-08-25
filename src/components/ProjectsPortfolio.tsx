import React from 'react';
import { ProjectPhoto, Testimonial } from '../types';
import { Star, MapPin, Calendar, Quote, ThumbsUp } from 'lucide-react';

interface ProjectsPortfolioProps {
  projects: ProjectPhoto[];
  testimonials: Testimonial[];
}

export const ProjectsPortfolio: React.FC<ProjectsPortfolioProps> = ({ projects, testimonials }) => {
  return (
    <div className="py-6 px-4 container mx-auto max-w-6xl space-y-10">
      {/* Portfolio Section */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Galería de <span className="text-sky-600">Proyectos Realizados</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
            Obras terminadas de instalación de piscinas en quintas, barrios privados y residencias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map(proj => (
            <div key={proj.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col group">
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                <img
                  src={proj.imageUrl}
                  alt={proj.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  {proj.location}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-sky-600 font-bold mb-1">
                    <span>{proj.poolModel}</span>
                    <span className="text-slate-400 font-normal flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {proj.date}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{proj.title}</h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{proj.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-sky-50/70 border border-sky-100 rounded-3xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <ThumbsUp className="w-5 h-5 text-sky-600" />
            <span>Testimonios de Nuestros Clientes</span>
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            Opiniones verificadas de familias que disfrutan el verano con Piscinas Bruzzone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map(test => (
            <div key={test.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < test.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{test.date}</span>
                </div>
                <p className="text-slate-700 text-xs italic leading-relaxed">
                  "{test.comment}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">
                  {test.clientName.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-xs block">{test.clientName}</span>
                  <span className="text-[10px] text-slate-400">{test.location} • {test.poolModel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
