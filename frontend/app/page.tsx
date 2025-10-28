'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Statistics, Question } from '@/lib/types';
import Link from 'next/link';
import { 
  BarChart3, TrendingDown, Shield, Activity, 
  Search, Filter, ArrowRight, Zap, AlertCircle,
  BookOpen, Code, FileText, Brain, ChevronRight, Database
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterES, setFilterES] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, questionsData] = await Promise.all([
        apiClient.getStatistics(),
        apiClient.getQuestions(),
      ]);
      setStats(statsData as Statistics);
      setQuestions(questionsData as Question[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || q.type === filterType;
    const es = q.exploitabilityScore || 0;
    const matchesES = filterES === 'all' ||
                     (filterES === 'resistant' && es < 30) ||
                     (filterES === 'moderate' && es >= 30 && es < 70) ||
                     (filterES === 'vulnerable' && es >= 70);
    return matchesSearch && matchesType && matchesES;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading AAD Framework...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl opacity-10 blur-xl"></div>
                <div className="relative bg-gradient-to-br from-indigo-600/5 to-purple-600/5 backdrop-blur-sm p-3 rounded-2xl border border-indigo-200/20">
                  <Shield className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AAD Framework
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Adversarial Assessment Design System
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/analyzer"
                className="group px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 font-medium flex items-center gap-2"
              >
                <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
                New Question
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Questions"
            value={stats?.totalQuestions || 0}
            icon={<Database className="w-6 h-6" strokeWidth={1.5} />}
            color="indigo"
            trend="+12%"
          />
          <StatCard
            title="Average ES"
            value={stats?.averageES.toFixed(1) || '0'}
            icon={<BarChart3 className="w-6 h-6" strokeWidth={1.5} />}
            color="purple"
            subtitle={getESInterpretation(stats?.averageES || 0)}
          />
          <StatCard
            title="AI-Resistant"
            value={`${stats?.aiResistantPercentage.toFixed(0) || 0}%`}
            icon={<Shield className="w-6 h-6" strokeWidth={1.5} />}
            color="emerald"
            subtitle={`${Math.round((stats?.aiResistantPercentage || 0) / 100 * (stats?.totalQuestions || 0))} questions`}
          />
          <StatCard
            title="Tests Run"
            value={stats?.testsRun || 0}
            icon={<Zap className="w-6 h-6" strokeWidth={1.5} />}
            color="orange"
            trend="+23 today"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="all">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="short-answer">Short Answer</option>
                <option value="essay">Essay</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div>
              <select
                value={filterES}
                onChange={(e) => setFilterES(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="all">All ES Levels</option>
                <option value="resistant">AI-Resistant (0-30)</option>
                <option value="moderate">Moderate (30-70)</option>
                <option value="vulnerable">Vulnerable (70-100)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
          </div>
        </div>

        {/* Question Cards Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Modern Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
}) {
  const bgClasses = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/30',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/30',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/30',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-200/30',
  };

  const iconColors = {
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md hover:bg-white/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-emerald-600 font-medium mt-1">{trend}</p>
          )}
        </div>
        <div className={`bg-gradient-to-br ${bgClasses[color as keyof typeof bgClasses]} backdrop-blur-sm p-3 rounded-xl border ${iconColors[color as keyof typeof iconColors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Modern Question Card Component
function QuestionCard({ question }: { question: Question }) {
  const es = question.exploitabilityScore || 0;
  const typeIcons: Record<string, React.ReactNode> = {
    'multiple-choice': <Shield className="w-4 h-4" strokeWidth={1.5} />,
    'short-answer': <FileText className="w-4 h-4" strokeWidth={1.5} />,
    'essay': <BookOpen className="w-4 h-4" strokeWidth={1.5} />,
    'coding': <Code className="w-4 h-4" strokeWidth={1.5} />,
    'project': <Brain className="w-4 h-4" strokeWidth={1.5} />,
  };

  return (
    <Link href={`/question/${question.id}`}>
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg hover:border-indigo-300/50 hover:bg-white/90 transition-all duration-200 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-500">{question.id}</span>
              <ESBadge score={es} size="sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {question.text}
            </h3>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
            {typeIcons[question.type]}
            {question.type.replace('-', ' ')}
          </span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
            {question.course}
          </span>
          {question.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <MetricItem label="Bloom's" value={question.bloomLevel} max={6} />
          <MetricItem label="Context" value={question.contextDependency} max={5} />
          <MetricItem label="Novelty" value={question.novelty} max={5} />
        </div>

        {/* AI Test Results */}
        {question.aiTestResults && question.aiTestResults.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI Performance:</span>
              <span className="font-semibold text-gray-900">
                {(question.aiTestResults.reduce((acc, r) => acc + r.accuracy, 0) / question.aiTestResults.length).toFixed(0)}% avg accuracy
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {question.aiTestResults.slice(0, 3).map((result, idx) => (
                <div key={idx} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-600 mb-1">{result.model.split('/')[1]}</div>
                  <div className="text-sm font-bold text-gray-900">{result.accuracy.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
          <span className="text-sm text-gray-500">
            {question.aiTestResults?.length || 0} AI tests
          </span>
          <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all">
            View Details
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function MetricItem({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function ESBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  let bgColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let label = 'AI-Resistant';
  
  if (score >= 70) {
    bgColor = 'bg-red-100 text-red-800 border-red-200';
    label = 'Vulnerable';
  } else if (score >= 50) {
    bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    label = 'Mod. Vulnerable';
  } else if (score >= 30) {
    bgColor = 'bg-blue-100 text-blue-800 border-blue-200';
    label = 'Mod. Resistant';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <div className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full font-medium border ${bgColor}`}>
      <span className="font-bold">{score.toFixed(0)}</span>
      <span className="opacity-75">·</span>
      <span>{label}</span>
    </div>
  );
}

function getESInterpretation(es: number): string {
  if (es < 30) return 'AI-Resistant';
  if (es < 50) return 'Moderately Resistant';
  if (es < 70) return 'Moderately Vulnerable';
  return 'Highly Vulnerable';
}
