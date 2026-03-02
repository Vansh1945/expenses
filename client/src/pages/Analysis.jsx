import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { MdTrendingUp, MdTrendingDown, MdLightbulb, MdHealthAndSafety, MdWarning, MdRefresh } from 'react-icons/md';

const Analysis = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchAnalysis = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await api.get('/analysis/summary');
            setAnalysis(res.data);
        } catch (err) {
            setError(true);
            toast.error('Failed to load financial analysis. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 text-sm">Analyzing your financial data...</p>
        </div>
    );

    if (error || !analysis) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-red-500 font-medium">Could not load analysis data.</p>
            <button
                onClick={fetchAnalysis}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
                <MdRefresh className="mr-2" /> Retry
            </button>
        </div>
    );

    // Safely extract values
    const prediction = Number(analysis.futureExpensePrediction) || 0;
    const healthScoreRaw = analysis.financialHealthScore || '0/100';
    const healthScore = parseInt(healthScoreRaw.split('/')[0], 10) || 0;
    const topCategory = analysis.spendingPattern?.topCategory || 'N/A';
    const growthRaw = analysis.monthlyGrowthPercentage || '0%';
    const growthValue = parseFloat(growthRaw) || 0;
    const isPositiveGrowth = growthValue > 0;

    // Health score color
    const scoreColor =
        healthScore >= 80 ? 'text-green-600 border-green-500' :
            healthScore >= 50 ? 'text-yellow-600 border-yellow-500' :
                'text-red-600 border-red-500';

    const progressColor =
        healthScore >= 80 ? 'bg-green-500' :
            healthScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500';

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Financial Insights &amp; Prediction</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* AI Prediction Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow p-6 text-white flex flex-col justify-center min-h-[220px]">
                    <div className="flex items-center mb-3">
                        <MdLightbulb className="w-8 h-8 mr-3 text-yellow-300" />
                        <h2 className="text-xl font-bold">Smart Prediction</h2>
                    </div>
                    <p className="text-indigo-100 mb-4 text-sm">
                        Based on your 3-month rolling average, your predicted spend next month:
                    </p>
                    {prediction > 0 ? (
                        <p className="text-5xl font-extrabold">
                            ₹{prediction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                    ) : (
                        <p className="text-indigo-200 text-sm italic">
                            Not enough data yet. Add expenses across multiple months to generate a prediction.
                        </p>
                    )}
                </div>

                {/* Health Score Card */}
                <div className={`bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center border-t-4 ${scoreColor.split(' ')[1]}`}>
                    <MdHealthAndSafety className={`w-12 h-12 mb-3 ${scoreColor.split(' ')[0]}`} />
                    <h2 className="text-lg font-medium text-gray-500 mb-1">Financial Health Score</h2>
                    <div className="flex items-baseline">
                        <span className={`text-6xl font-black ${scoreColor.split(' ')[0]}`}>{healthScore}</span>
                        <span className="text-2xl text-gray-400 font-bold ml-1">/100</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full mt-4 bg-gray-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-700 ${progressColor}`}
                            style={{ width: `${Math.min(100, healthScore)}%` }}
                        ></div>
                    </div>
                    <p className="mt-3 text-xs text-center text-gray-400 px-4">
                        {healthScore >= 80 ? '🎉 Excellent! You are well within budget.' :
                            healthScore >= 50 ? '⚠️ Good, but keep an eye on your spending.' :
                                '🚨 You are over budget. Review your expenses.'}
                    </p>
                </div>

                {/* Top Spending Category */}
                <div className="bg-white rounded-xl shadow p-6 flex items-start">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4 shrink-0">
                        <MdWarning className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Primary Expenditure Category</h3>
                        {topCategory !== 'N/A' ? (
                            <>
                                <p className="text-gray-600 mt-1">
                                    You spend the most on <strong className="text-orange-600">{topCategory}</strong> this month.
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Review this category to improve your health score.
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm mt-1 italic">
                                No expense data for the current month yet.
                            </p>
                        )}
                    </div>
                </div>

                {/* Month-over-Month Growth */}
                <div className="bg-white rounded-xl shadow p-6 flex items-start">
                    <div className={`p-3 rounded-lg mr-4 shrink-0 ${isPositiveGrowth ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isPositiveGrowth
                            ? <MdTrendingUp className="w-6 h-6" />
                            : <MdTrendingDown className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Month-over-Month Spending</h3>
                        {growthValue !== 0 ? (
                            <p className="text-gray-600 mt-1 flex items-center flex-wrap gap-2">
                                Your spending
                                <span className={`px-2 py-0.5 rounded text-sm font-bold ${isPositiveGrowth ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {isPositiveGrowth ? '▲' : '▼'} {Math.abs(growthValue).toFixed(1)}%
                                </span>
                                {isPositiveGrowth ? 'increased' : 'decreased'} vs last month.
                            </p>
                        ) : (
                            <p className="text-gray-400 text-sm mt-1 italic">
                                No data to compare. Add expenses in consecutive months.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analysis;
