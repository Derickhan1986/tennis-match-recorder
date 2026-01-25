//
// Result Visualizer Utility
// 结果可视化工具
//
// Generates charts using Chart.js to visualize test results
// 使用Chart.js生成图表以可视化测试结果
//

class ResultVisualizer {
    constructor() {
        this.charts = {};
    }

    // Create all charts
    // 创建所有图表
    createCharts(testResults, containerId = 'charts-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Clear existing charts
        // 清除现有图表
        container.innerHTML = '';

        // Create chart containers
        // 创建图表容器
        const chartContainer1 = this.createChartContainer('pass-rate-chart', 'Overall Pass Rate');
        // 总体通过率
        const chartContainer2 = this.createChartContainer('statistic-differences-chart', 'Statistic Differences by Type');
        // 按类型统计的差异
        const chartContainer3 = this.createChartContainer('matches-vs-differences-chart', 'Matches vs Differences');
        // 比赛场次vs差异
        const chartContainer4 = this.createChartContainer('scenario-pass-rate-chart', 'Pass Rate by Scenario');
        // 按场景的通过率
        const chartContainer5 = this.createChartContainer('difference-heatmap-chart', 'Difference Heatmap');
        // 差异热力图

        container.appendChild(chartContainer1);
        container.appendChild(chartContainer2);
        container.appendChild(chartContainer3);
        container.appendChild(chartContainer4);
        container.appendChild(chartContainer5);

        // Create charts
        // 创建图表
        this.createPassRateChart(testResults, 'pass-rate-chart');
        this.createStatisticDifferencesChart(testResults, 'statistic-differences-chart');
        this.createMatchesVsDifferencesChart(testResults, 'matches-vs-differences-chart');
        this.createScenarioPassRateChart(testResults, 'scenario-pass-rate-chart');
        this.createDifferenceHeatmap(testResults, 'difference-heatmap-chart');
    }

    // Create chart container
    // 创建图表容器
    createChartContainer(id, title) {
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.innerHTML = `
            <h3>${title}</h3>
            <canvas id="${id}"></canvas>
        `;
        return container;
    }

    // Create pass rate pie chart
    // 创建通过率饼图
    createPassRateChart(testResults, canvasId) {
        const summary = testResults.summary;
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const passed = summary.passed || 0;
        const failed = summary.failed || 0;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Passed', 'Failed'],
                // 通过, 失败
                datasets: [{
                    data: [passed, failed],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Create statistic differences bar chart
    // 创建统计差异柱状图
    createStatisticDifferencesChart(testResults, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Group differences by type
        // 按类型分组差异
        const differencesByType = {};
        for (const result of testResults.results) {
            if (!result.passed && result.differences) {
                for (const diff of result.differences) {
                    const type = diff.type || 'unknown';
                    differencesByType[type] = (differencesByType[type] || 0) + 1;
                }
            }
        }

        const types = Object.keys(differencesByType);
        const counts = types.map(type => differencesByType[type]);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types,
                datasets: [{
                    label: 'Number of Differences',
                    // 差异数量
                    data: counts,
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Create matches vs differences line chart
    // 创建比赛场次vs差异折线图
    createMatchesVsDifferencesChart(testResults, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Calculate cumulative differences
        // 计算累积差异
        const matchNumbers = [];
        const cumulativeDifferences = [];
        let totalDifferences = 0;

        for (let i = 0; i < testResults.results.length; i++) {
            const result = testResults.results[i];
            matchNumbers.push(i + 1);
            
            if (!result.passed && result.differences) {
                totalDifferences += result.differences.length;
            }
            cumulativeDifferences.push(totalDifferences);
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: matchNumbers,
                datasets: [{
                    label: 'Cumulative Differences',
                    // 累积差异
                    data: cumulativeDifferences,
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Create scenario pass rate comparison chart
    // 创建场景通过率对比图表
    createScenarioPassRateChart(testResults, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Group results by scenario
        // 按场景分组结果
        const scenarioStats = {};
        for (const result of testResults.results) {
            const scenario = result.scenario || 'Unknown';
            if (!scenarioStats[scenario]) {
                scenarioStats[scenario] = { passed: 0, total: 0 };
            }
            scenarioStats[scenario].total++;
            if (result.passed) {
                scenarioStats[scenario].passed++;
            }
        }

        const scenarios = Object.keys(scenarioStats);
        const passRates = scenarios.map(scenario => {
            const stats = scenarioStats[scenario];
            return stats.total > 0 ? (stats.passed / stats.total * 100) : 0;
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: 'Pass Rate (%)',
                    // 通过率 (%)
                    data: passRates,
                    backgroundColor: '#9C27B0',
                    borderColor: '#7B1FA2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const scenario = context.label;
                                const stats = scenarioStats[scenario];
                                return `Pass Rate: ${context.parsed.x.toFixed(1)}% (${stats.passed}/${stats.total})`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Create difference heatmap
    // 创建差异热力图
    createDifferenceHeatmap(testResults, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Collect all statistics that have differences
        // 收集所有有差异的统计
        const statisticCounts = {};
        for (const result of testResults.results) {
            if (!result.passed && result.differences) {
                for (const diff of result.differences) {
                    if (diff.statistic) {
                        const key = `${diff.player || 'unknown'}_${diff.statistic}`;
                        statisticCounts[key] = (statisticCounts[key] || 0) + 1;
                    }
                }
            }
        }

        // Sort by count
        // 按计数排序
        const sortedStats = Object.entries(statisticCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); // Top 20
        // 前20

        const labels = sortedStats.map(([key]) => key);
        const counts = sortedStats.map(([, count]) => count);

        // Create color scale
        // 创建颜色比例
        const maxCount = Math.max(...counts, 1);
        const colors = counts.map(count => {
            const intensity = count / maxCount;
            return `rgba(244, 67, 54, ${0.3 + intensity * 0.7})`;
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Difference Count',
                    // 差异计数
                    data: counts,
                    backgroundColor: colors,
                    borderColor: '#D32F2F',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Destroy all charts
    // 销毁所有图表
    destroyCharts() {
        for (const chartId in this.charts) {
            if (this.charts[chartId]) {
                this.charts[chartId].destroy();
            }
        }
        this.charts = {};
    }
}

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultVisualizer;
}

