import React, { useState } from 'react';
import { ABADA_GRADUATIONS } from '../data/abadaGraduations';
import { X, Award, Shield, BookOpen, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface GraduationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraduationModal: React.FC<GraduationModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();
  const [selectedCorda, setSelectedCorda] = useState(ABADA_GRADUATIONS[0]);
  const [activeTab, setActiveTab] = useState<'adulto' | 'infantil'>('adulto');

  if (!isOpen) return null;

  const userCorda = user?.corda || 'Corda Crua';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${accentClasses.badge} border`}>
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                Sistema de Graduação
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-normal">
                  ABADÁ-Capoeira
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Criado por Mestre Camisa inspirado nas cores da natureza e valorização humana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user corda alert */}
        {user && (
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-zinc-300">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Sua corda atual cadastrada:</span>
              <strong className="text-amber-400">{userCorda}</strong>
            </div>
            {user.apelido && (
              <span className="text-zinc-500 hidden sm:inline">
                Capoeirista: {user.apelido}
              </span>
            )}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex border-b border-zinc-800 px-4 sm:px-6 bg-zinc-950/60 pt-2">
          <button
            onClick={() => setActiveTab('adulto')}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'adulto'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Graduação Adulta (a partir de 16 anos)
          </button>
          <button
            onClick={() => setActiveTab('infantil')}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'infantil'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Graduação Infantil (até 15 anos)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Cordas List (Left Column) */}
          <div className="md:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {activeTab === 'adulto' ? (
              ABADA_GRADUATIONS.map((corda) => {
                const isSelected = selectedCorda.id === corda.id;
                const isUserCurrent = userCorda.toLowerCase().includes(corda.name.toLowerCase());

                return (
                  <button
                    key={corda.id}
                    onClick={() => setSelectedCorda(corda)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Visual representation of the braided corda */}
                      <div className="w-10 h-3 rounded-full overflow-hidden border border-zinc-600 flex shrink-0 shadow-xs">
                        <div
                          className="h-full flex-1"
                          style={{ backgroundColor: corda.colorLeft }}
                        />
                        {corda.colorRight && (
                          <div
                            className="h-full flex-1 border-l border-zinc-900/40"
                            style={{ backgroundColor: corda.colorRight }}
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs sm:text-sm text-zinc-100">
                            {corda.name}
                          </span>
                          {isUserCurrent && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        {corda.title && (
                          <span className="text-[11px] text-amber-400/90 font-medium block">
                            {corda.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-amber-400 rotate-90' : 'text-zinc-600'}`} />
                  </button>
                );
              })
            ) : (
              <div className="space-y-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-300 text-xs sm:text-sm">
                <p className="font-semibold text-amber-400">Sistema Infantil de Cordas:</p>
                <p>
                  Para alunos até os 15 anos, a corda base permanece sempre crua, com as pontas recebendo a cor correspondente ao estágio de evolução:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-zinc-400">
                  <li>Corda Crua com ponta Cinza (Iniciação infantil)</li>
                  <li>Corda Crua com ponta Cinza e Amarela</li>
                  <li>Corda Crua com ponta Amarela</li>
                  <li>Corda Crua com ponta Amarela e Laranja</li>
                  <li>Corda Crua com ponta Laranja</li>
                  <li>Corda Crua com ponta Laranja e Azul</li>
                  <li>Corda Crua com ponta Azul (Aluno graduado mirim)</li>
                </ul>
                <p className="text-[11px] text-zinc-500 italic">
                  Ao completar 16 anos, o jovem passa para a graduação adulta mediante avaliação técnica e pedagógica.
                </p>
              </div>
            )}
          </div>

          {/* Corda Detail View (Right Column) */}
          <div className="md:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Visual Banner */}
              <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                    Estágio #{selectedCorda.level} • {selectedCorda.title || 'Graduação'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {selectedCorda.name}
                  </h3>
                </div>

                {/* Big Corda Graphic */}
                <div className="w-24 h-6 rounded-full overflow-hidden border-2 border-zinc-500 flex shadow-inner">
                  <div
                    className="h-full flex-1"
                    style={{ backgroundColor: selectedCorda.colorLeft }}
                  />
                  {selectedCorda.colorRight && (
                    <div
                      className="h-full flex-1 border-l-2 border-black/50"
                      style={{ backgroundColor: selectedCorda.colorRight }}
                    />
                  )}
                </div>
              </div>

              {/* Simbologia & Significado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Símbolo da Natureza
                  </div>
                  <p className="text-sm font-medium text-zinc-100">
                    {selectedCorda.symbol}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Significado Filosófico
                  </div>
                  <p className="text-sm font-medium text-zinc-100">
                    {selectedCorda.meaning}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Fundamentos & Exigências do Estágio
                </h4>
                <p className="text-sm leading-relaxed text-zinc-300 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/60">
                  {selectedCorda.description}
                </p>
              </div>

              {/* Official source link */}
              <div className="pt-2 text-xs text-zinc-500">
                Informações extraídas da metodologia oficial do grupo:{' '}
                <a
                  href="https://www.abadabgcapoeira.com/sistema-de-gradua%C3%A7%C3%A3o"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  abadabgcapoeira.com/sistema-de-graduação
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
