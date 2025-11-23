'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Question } from '@/lib/types';
import { 
  ArrowLeft, Shield, Brain, Target, Zap, AlertTriangle,
  CheckCircle2, Lock, Unlock, Layers, Gauge, Sparkles, Radar
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar as RechartsRadar, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Force dynamic rendering to prevent 404 on Vercel
export const dynamic = 'force-dynamic';

export default function QuestionDetailPage() {
  const params = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestion();
  }, [params.id]);

  const loadQuestion = async () => {
    try {
      const questionId = Array.isArray(params.id) ? params.id[0] : params.id;
      const data = await apiClient.getQuestion(questionId) as Question;
      setQuestion(data);
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Question not found</h2>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const metrics = calculateComprehensiveMetrics(question);
  const aiResults = question.aiTestResults || [];
  
  // Convert correctAnswer to string (could be index or letter)
  const correctAnswerStr = typeof question.correctAnswer === 'number' 
    ? String.fromCharCode(65 + question.correctAnswer) // 0->A, 1->B, etc
    : (question.correctAnswer || 'A');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
              Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-gray-100 rounded">{question.id}</span>
              <ESBadge score={metrics.finalScore} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuestionCard question={question} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ScoreCard metrics={metrics} />

          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Brain className="w-4 h-4" strokeWidth={1.5} />}
              label="Bloom's Level"
              value={question.bloomLevel}
              max={6}
              color="indigo"
              subtitle={getBloomLabel(question.bloomLevel)}
            />
            <MetricCard
              icon={<Layers className="w-4 h-4" strokeWidth={1.5} />}
              label="Cognitive Load"
              value={metrics.cognitive.cognitiveLoad}
              max={10}
              color="purple"
              subtitle="Mental effort"
            />
            <MetricCard
              icon={<Target className="w-4 h-4" strokeWidth={1.5} />}
              label="Difficulty"
              value={metrics.psychometric.difficulty}
              max={100}
              color="orange"
              subtitle={getDifficultyLabel(metrics.psychometric.difficulty)}
            />
            <MetricCard
              icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
              label="Uniqueness"
              value={metrics.aiResistance.uniqueness}
              max={100}
              color="emerald"
              subtitle="Pattern novelty"
            />
          </div>
        </div>

        <AIResultsPanel 
          aiResults={aiResults}
          metrics={metrics} 
          correctAnswer={correctAnswerStr}
          questionId={question.id}
          onResultsUpdate={loadQuestion}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RadarChartCard metrics={metrics} />
          <BarChartCard metrics={metrics} />
        </div>

        <DetailedMetrics question={question} metrics={metrics} />
      </main>
    </div>
  );
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-5 mb-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Shield className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{question.course} • {question.type}</p>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">{question.text}</h1>
        </div>
      </div>

      {question.options && question.options.length > 0 && (
        <div className="mt-4 space-y-2">
          {question.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isCorrect = question.correctAnswer === letter || question.correctAnswer === idx;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                  isCorrect
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-gray-50/50 border-gray-200'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-700'
                }`}>
                  {letter}
                </div>
                <p className="text-sm text-gray-800 flex-1">{option}</p>
                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ metrics }: { metrics: any }) {
  // Determine score color and gradient based on value
  const getScoreStyles = (score: number) => {
    if (score < 30) return {
      text: 'text-emerald-600',
      bg: 'from-emerald-500/10 via-purple-400/5 to-transparent',
      glow: 'shadow-purple-200/30',
      border: 'border-purple-200/40',
      iconBg: 'from-emerald-500/15 to-purple-500/10'
    };
    if (score < 70) return {
      text: 'text-amber-600',
      bg: 'from-amber-500/10 via-purple-400/5 to-transparent',
      glow: 'shadow-purple-200/30',
      border: 'border-purple-200/40',
      iconBg: 'from-amber-500/15 to-purple-500/10'
    };
    return {
      text: 'text-red-600',
      bg: 'from-red-500/10 via-purple-400/5 to-transparent',
      glow: 'shadow-purple-200/30',
      border: 'border-purple-200/40',
      iconBg: 'from-red-500/15 to-purple-500/10'
    };
  };

  const styles = getScoreStyles(metrics.finalScore);

  return (
    <div className="lg:col-span-1">
      <div className={`relative bg-white/85 backdrop-blur-xl rounded-xl p-5 border ${styles.border} shadow-md ${styles.glow} hover:shadow-lg transition-all duration-300 overflow-hidden`}>
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${styles.bg} pointer-events-none`} />
        
        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${styles.iconBg} border ${styles.border}`}>
              <Gauge className={`w-4 h-4 ${styles.text}`} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Exploitability Score</h3>
          </div>
          <div className="text-center my-5">
            <div className={`text-6xl font-black mb-1 ${styles.text}`}>
              {metrics.finalScore}
            </div>
            <div className="text-xs text-gray-500 font-medium">out of 100</div>
          </div>
          <div className="space-y-2.5 text-xs">
            <ScoreContribution label="Cognitive" value={metrics.cognitive.score} weight={30} />
            <ScoreContribution label="AI Resistance" value={metrics.aiResistance.score} weight={35} />
            <ScoreContribution label="Psychometric" value={metrics.psychometric.score} weight={20} />
            <ScoreContribution label="Security" value={metrics.security.score} weight={15} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AIResultsPanel({ aiResults: initialResults, metrics, correctAnswer, questionId, onResultsUpdate }: { 
  aiResults: any[]; 
  metrics: any; 
  correctAnswer: string;
  questionId: string;
  onResultsUpdate: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [aiResults, setAiResults] = useState(initialResults);
  
  // Update aiResults when initialResults changes
  useEffect(() => {
    setAiResults(initialResults);
  }, [initialResults]);
  
  const availableModels = [
    // Meta Llama - FREE & Modern
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', provider: 'Meta', category: 'free-modern' },
    { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)', provider: 'Meta', category: 'free-modern' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', provider: 'Meta', category: 'free-modern' },
    
    // Google Gemini - FREE & Modern
    { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (Free)', provider: 'Google', category: 'free-modern' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (Free)', provider: 'Google', category: 'free-modern' },
    
    // Mistral - FREE
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', provider: 'Mistral AI', category: 'free-modern' },
    { id: 'mistralai/mixtral-8x7b-instruct:free', name: 'Mixtral 8x7B (Free)', provider: 'Mistral AI', category: 'free-modern' },
    
    // Microsoft Phi - FREE & Small but Smart
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini (Free)', provider: 'Microsoft', category: 'free-modern' },
    { id: 'microsoft/phi-3-medium-128k-instruct:free', name: 'Phi-3 Medium (Free)', provider: 'Microsoft', category: 'free-modern' },
    
    // Qwen - FREE & Modern
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B (Free)', provider: 'Alibaba', category: 'free-modern' },
    
    // OLD & WEAK Models - FREE (for baseline comparison)
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Old, Weak)', provider: 'OpenAI Legacy', category: 'old-weak' },
    { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Zephyr 7B Beta (Old, Free)', provider: 'HuggingFace', category: 'old-weak' },
    
    // Paid but popular (for reference)
    { id: 'openai/gpt-4o', name: 'GPT-4o (Paid)', provider: 'OpenAI', category: 'paid' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Paid)', provider: 'OpenAI', category: 'paid' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Paid)', provider: 'Anthropic', category: 'paid' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Paid)', provider: 'Anthropic', category: 'paid' },
  ];

  const handleTestModel = async () => {
    setTesting(true);
    
    try {
      // Call the API to test the question
      const response = await apiClient.testQuestion(questionId, [selectedModel]) as any;
      
      // Reload the entire question to get updated results and ES
      if (response.testResults && response.testResults.length > 0) {
        // Trigger a reload of the question data
        onResultsUpdate();
      }
    } catch (error) {
      console.error('Failed to test question:', error);
      alert('Failed to test question. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
          <div>
            <h2 className="text-base font-semibold text-gray-900">AI Vulnerability Test</h2>
            <p className="text-xs text-gray-500">Models tested: {aiResults.length} • {availableModels.length} models available (12 free)</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
          metrics.security.aiSuccessRate >= 80 ? 'bg-red-100 text-red-700' :
          metrics.security.aiSuccessRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
          'bg-emerald-100 text-emerald-700'
        }`}>
          {metrics.security.aiSuccessRate.toFixed(0)}% Solved
        </div>
      </div>

      {/* Compact AI Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {aiResults.length === 0 ? (
          <div className="col-span-full text-center py-6 text-gray-500 text-sm">
            No AI tests yet. Select a model and click "Test Model" to begin.
          </div>
        ) : (
          aiResults.map((result, idx) => {
            const modelName = result.model.split('/').pop()?.replace('-', ' ') || result.model;
            
            // Handle both old and new result formats
            const isCorrect = result.isCorrect !== undefined ? result.isCorrect : (result.accuracy === 100);
            const selectedAnswer = result.selectedOption || 
                                  (result.accuracy === 100 ? correctAnswer : '?');
            const isMatch = selectedAnswer !== '?' && selectedAnswer === correctAnswer;
            const confidence = result.confidence || result.accuracy || 0;
            
            return (
              <div
                key={idx}
                className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 shadow-md ${
                  isMatch
                    ? 'bg-transparent border-red-500 shadow-red-200'
                    : selectedAnswer === '?'
                    ? 'bg-transparent border-gray-400 shadow-gray-200'
                    : 'bg-transparent border-emerald-500 shadow-emerald-200'
                } hover:shadow-lg`}
              >
                {/* Model name */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-800 truncate uppercase tracking-wide">
                    {modelName}
                  </span>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-black ${
                    isMatch 
                      ? 'bg-red-100 text-red-900 border border-red-400' 
                      : selectedAnswer === '?'
                      ? 'bg-gray-100 text-gray-700 border border-gray-400'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                  }`}>
                    {isMatch ? 'SOLVED' : selectedAnswer === '?' ? 'OLD' : 'SAFE'}
                  </div>
                </div>
                
                {/* Selected answer - BIG and BOLD */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black leading-none ${
                      isMatch ? 'text-red-700' : 
                      selectedAnswer === '?' ? 'text-gray-500' :
                      'text-emerald-700'
                    }`}>
                      {selectedAnswer}
                    </span>
                  </div>
                </div>
                
                {/* Confidence bar */}
                {confidence > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-gray-600 font-medium">
                        {result.confidence ? 'Confidence' : 'Accuracy'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-700">{confidence.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          isMatch ? 'bg-red-600' : 
                          selectedAnswer === '?' ? 'bg-gray-400' :
                          'bg-emerald-600'
                        }`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="mt-2 text-[9px] text-gray-500">
                  {new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Correct Answer Reference */}
      <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-indigo-700 font-medium">Correct Answer:</span>
          <span className="text-2xl font-black text-indigo-900">{correctAnswer}</span>
        </div>
      </div>

      {/* Test New Model Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <optgroup label="FREE - Modern & Powerful (Recommended)">
              {availableModels.filter(m => m.category === 'free-modern' && m.provider === 'Meta').map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
            <optgroup label="FREE - Google Gemini">
              {availableModels.filter(m => m.category === 'free-modern' && m.provider === 'Google').map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
            <optgroup label="FREE - Mistral AI">
              {availableModels.filter(m => m.category === 'free-modern' && m.provider === 'Mistral AI').map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
            <optgroup label="FREE - Microsoft Phi & Others">
              {availableModels.filter(m => m.category === 'free-modern' && (m.provider === 'Microsoft' || m.provider === 'Alibaba')).map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
            <optgroup label="OLD & WEAK - Free (Baseline Comparison)">
              {availableModels.filter(m => m.category === 'old-weak').map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
            <optgroup label="PAID - Premium Models">
              {availableModels.filter(m => m.category === 'paid').map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
          </select>
          <button
            onClick={handleTestModel}
            disabled={testing}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[140px]"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" strokeWidth={2} />
                Test Model
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 px-3 py-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
          <span className="font-medium text-indigo-900">Tip:</span> Free models have no cost limits. Try Llama 3.1 70B or Gemini 1.5 Pro for best results. Old models are weaker for baseline comparison.
        </p>
      </div>
    </div>
  );
}

function RadarChartCard({ metrics }: { metrics: any }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Radar className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
        Cognitive & Resistance Profile
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={metrics.radarData}>
          <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <RechartsRadar
            name="Score"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChartCard({ metrics }: { metrics: any }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Target className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
        Weighted Component Scores
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={metrics.barData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} width={100} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Bar dataKey="score" radius={[0, 8, 8, 0]}>
            {metrics.barData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DetailedMetrics({ question, metrics }: { question: Question; metrics: any }) {
  const metricCategories = [
    {
      title: 'Cognitive Complexity',
      icon: <Brain className="w-4 h-4" strokeWidth={1.5} />,
      color: 'indigo',
      metrics: [
        { label: 'Knowledge Depth', value: metrics.cognitive.knowledgeDepth, max: 5 },
        { label: 'Transfer Distance', value: metrics.cognitive.transferDistance, max: 5 },
        { label: 'Cognitive Load', value: metrics.cognitive.cognitiveLoad, max: 10 },
      ]
    },
    {
      title: 'AI Resistance',
      icon: <Shield className="w-4 h-4" strokeWidth={1.5} />,
      color: 'emerald',
      metrics: [
        { label: 'Context Dependency', value: question.contextDependency, max: 5 },
        { label: 'Novelty Score', value: question.novelty, max: 5 },
        { label: 'Pattern Complexity', value: metrics.aiResistance.patternComplexity, max: 100 },
      ]
    },
    {
      title: 'Psychometric Quality',
      icon: <Target className="w-4 h-4" strokeWidth={1.5} />,
      color: 'purple',
      metrics: [
        { label: 'Discrimination Index', value: metrics.psychometric.discrimination, max: 100 },
        { label: 'Distractor Quality', value: metrics.aiResistance.distractorQuality, max: 100 },
        { label: 'Guessing Factor', value: metrics.psychometric.guessingFactor, max: 100 },
      ]
    },
    {
      title: 'Security Metrics',
      icon: <Lock className="w-4 h-4" strokeWidth={1.5} />,
      color: 'orange',
      metrics: [
        { label: 'AI Success Rate', value: metrics.security.aiSuccessRate, max: 100, inverse: true },
        { label: 'Adversarial Robustness', value: metrics.security.adversarialRobustness, max: 100 },
        { label: 'Exploit Resistance', value: 100 - metrics.security.aiSuccessRate, max: 100 },
      ]
    }
  ];

  return (
    <div className="space-y-4 mt-4">
      {metricCategories.map((category, idx) => (
        <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg bg-${category.color}-100`}>
              {category.icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{category.title}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {category.metrics.map((metric, metricIdx) => (
              <DetailMetric 
                key={metricIdx} 
                label={metric.label} 
                value={metric.value} 
                max={metric.max}
                inverse={metric.inverse}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ESBadge({ score }: { score: number }) {
  let bgColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let label = 'AI-Resistant';
  let icon = <Shield className="w-3 h-3" />;
  
  if (score >= 70) {
    bgColor = 'bg-red-100 text-red-800 border-red-300';
    label = 'Vulnerable';
    icon = <AlertTriangle className="w-3 h-3" />;
  } else if (score >= 50) {
    bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    label = 'Moderate';
    icon = <AlertTriangle className="w-3 h-3" />;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bgColor}`}>
      {icon}
      <span className="font-bold">{score}</span>
      <span className="opacity-60">•</span>
      <span>{label}</span>
    </div>
  );
}

function ScoreContribution({ label, value, weight }: { label: string; value: number; weight: number }) {
  const contribution = (value * weight) / 100;
  const percentage = value;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-gray-700 font-medium">{label} ({weight}%)</span>
        <span className="font-bold text-gray-900">{contribution.toFixed(1)}</span>
      </div>
      <div className="h-1 bg-gray-200/60 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, max, color, subtitle }: any) {
  const percentage = (value / max) * 100;
  const colors: any = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/30 text-indigo-600',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/30 text-purple-600',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-200/30 text-orange-600',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/30 text-emerald-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-sm rounded-lg border p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={colors[color].split(' ')[2]}>{icon}</div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-500">/ {max}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function DetailMetric({ label, value, max, inverse }: { label: string; value: number; max: number; inverse?: boolean }) {
  const percentage = (value / max) * 100;
  
  // For inverse metrics (like AI Success Rate), red is good when low
  let barColor = 'bg-gradient-to-r from-indigo-500 to-purple-500';
  if (inverse) {
    if (percentage >= 70) barColor = 'bg-red-500';
    else if (percentage >= 40) barColor = 'bg-yellow-500';
    else barColor = 'bg-emerald-500';
  }
  
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{value.toFixed(max > 10 ? 0 : 1)}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function calculateComprehensiveMetrics(question: Question) {
  const bloomLevel = question.bloomLevel || 3;
  const cognitiveLoad = Math.min(10, bloomLevel + (question.contextDependency || 3));
  const knowledgeDepth = Math.min(5, Math.ceil(bloomLevel / 1.5));
  const transferDistance = question.novelty || 3;
  
  const cognitiveScore = (
    (bloomLevel / 6 * 40) +
    (cognitiveLoad / 10 * 25) +
    (knowledgeDepth / 5 * 20) +
    (transferDistance / 5 * 15)
  );

  const contextDependency = question.contextDependency || 3;
  const novelty = question.novelty || 3;
  const patternComplexity = Math.min(100, (contextDependency * 15) + (novelty * 10));
  const distractorQuality = question.options ? Math.min(100, question.options.length * 20) : 60;
  const uniqueness = Math.min(100, (novelty * 18) + (patternComplexity * 0.2));
  
  const aiResistanceScore = (
    (contextDependency / 5 * 30) +
    (novelty / 5 * 25) +
    (patternComplexity / 100 * 25) +
    (distractorQuality / 100 * 20)
  );

  const difficulty = Math.min(100, (bloomLevel * 12) + (contextDependency * 8) + (novelty * 5));
  const discrimination = Math.min(100, 50 + (bloomLevel * 5) + (contextDependency * 3));
  const guessingFactor = question.options ? Math.max(0, 100 - (question.options.length * 20)) : 50;
  
  const psychometricScore = (
    (difficulty / 100 * 40) +
    (discrimination / 100 * 40) +
    ((100 - guessingFactor) / 100 * 20)
  );

  const aiResults = question.aiTestResults || [];
  const aiSuccessRate = aiResults.length > 0
    ? (aiResults.filter(r => r.accuracy === 100 || r.isCorrect).length / aiResults.length) * 100
    : 50;
  
  const adversarialRobustness = 100 - aiSuccessRate;
  const securityScore = (adversarialRobustness / 100 * 70) + ((100 - aiSuccessRate) / 100 * 30);

  const finalScore = Math.round(
    (cognitiveScore * 0.30) +
    (aiResistanceScore * 0.35) +
    (psychometricScore * 0.20) +
    (securityScore * 0.15)
  );

  const radarData = [
    { metric: "Bloom's", value: (bloomLevel / 6) * 100 },
    { metric: 'Context', value: (contextDependency / 5) * 100 },
    { metric: 'Novelty', value: (novelty / 5) * 100 },
    { metric: 'Difficulty', value: difficulty },
    { metric: 'Uniqueness', value: uniqueness },
    { metric: 'AI Defense', value: adversarialRobustness },
  ];

  const barData = [
    { name: 'Cognitive', score: cognitiveScore, color: '#6366f1' },
    { name: 'AI Resistance', score: aiResistanceScore, color: '#8b5cf6' },
    { name: 'Psychometric', score: psychometricScore, color: '#f59e0b' },
    { name: 'Security', score: securityScore, color: '#10b981' },
  ];

  return {
    finalScore,
    cognitive: { score: cognitiveScore, cognitiveLoad, knowledgeDepth, transferDistance },
    aiResistance: { score: aiResistanceScore, patternComplexity, distractorQuality, uniqueness },
    psychometric: { score: psychometricScore, difficulty, discrimination, guessingFactor },
    security: { score: securityScore, aiSuccessRate, adversarialRobustness },
    radarData,
    barData,
  };
}

function getBloomLabel(level: number): string {
  const labels = ['', 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
  return labels[level] || 'Unknown';
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 30) return 'Easy';
  if (difficulty < 50) return 'Moderate';
  if (difficulty < 70) return 'Hard';
  return 'Very Hard';
}
