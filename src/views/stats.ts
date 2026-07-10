// > Stats dashboard — Chart.js doughnut/bar charts with percentage labels
// ! JSON.stringify 输出中的 </ 被转义为 <\/ 防止 XSS
import { html, raw } from 'hono/html'
import { escHtml } from '../helpers/escape'

export type LevelItem = { label: string; value: number; color: string }
export type DurationItem = { label: string; count: number }
export type TopItem = { label: string; count: number }

export type StatsData = {
  total: number
  levels: LevelItem[]
  topDay: TopItem | null
  topMonth: TopItem | null
  topYear: TopItem | null
  durations: DurationItem[]
  topOperators: { name: string; count: number }[]
  dailyTrend: { date: string; count: number }[]
  durationCategories: { label: string; count: number; color: string }[]
}

export function StatsPage(props: StatsData) {
  const dataJson = JSON.stringify(props).replace(/<\//g, '<\\/')
  return html`
<div class="cyber-page" style="max-width:900px;margin:0 auto;padding:var(--spacing-xl) var(--spacing-md) var(--spacing-lg);">

  <h1 class="page-title" style="font-size:32px;margin-bottom:var(--spacing-xs);">统计信息</h1>
  <p style="font-size:15px;color:var(--label-2);margin-bottom:var(--spacing-lg);">全服封禁数据概览（已归档除外）</p>

  <style>
    .chart-container { position:relative; }
    .chart-container canvas { display:block; }
    .chart-container .no-data { display:flex;align-items:center;justify-content:center;height:260px;color:var(--label-3);font-size:14px;font-family:var(--sans); }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4" defer></script>
  <script defer>
  document.addEventListener('DOMContentLoaded', function(){
    var data = ${raw(dataJson)};
    if (!data || !data.total) return;
    var colors = data.levels.map(function(l){return l.color});
    var labels = data.levels.map(function(l){return l.label});
    var values = data.levels.map(function(l){return l.value});
    var textColor = '#c0c0c0';
    var gridColor = 'rgba(255,255,255,.08)';

    function initChart(id, cfg) {
      var el = document.getElementById(id);
      if (!el) return;
      try { new Chart(el.getContext('2d'), cfg); } catch(e){}
    }
    // * 自定义 afterDraw 插件在饼图上显示百分比标签
    // * 只显示 ≥4% 的扇区，避免标签挤在一起
    // ? 未使用 chartjs-plugin-datalabels 以避免 CDN 兼容问题
    function pctLabelPlugin() {
      return {
        id:'pctLabels',
        afterDraw: function(chart) {
          var ctx=chart.ctx, t=(data&&data.total)||1;
          chart.data.datasets.forEach(function(ds,i){
            var meta=chart.getDatasetMeta(i);
            if (meta.data.length <= 1) return;
            meta.data.forEach(function(el,j){
              var v=ds.data[j], p=v/t*100;
              if(p<4) return;
              ctx.font='bold 13px sans-serif';
              var txt=Math.round(p)+'%', tw=ctx.measureText(txt).width;
              ctx.fillStyle='rgba(0,0,0,.55)';
              ctx.fillRect(el.x-tw/2-3,el.y-9,tw+6,18);
              ctx.fillStyle='#fff';
              ctx.textAlign='center';
              ctx.textBaseline='middle';
              ctx.fillText(txt,el.x,el.y);
            });
          });
        }
      };
    }

    // Pie
    initChart('levelPieChart', {
      type: 'doughnut',
      plugins: [pctLabelPlugin()],
      data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }] },
      options: { aspectRatio: 1, plugins: {
        legend: { position:'bottom', labels: { color:textColor, padding:12, font:{size:12} } },
        tooltip: { callbacks: { label: function(ctx){var t=data.total||1;return ctx.label+': '+ctx.parsed+' ('+Math.round(ctx.parsed/t*100)+'%)'} } }
      } }
    });

    // Bar
    initChart('levelBarChart', {
      type: 'bar',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderColor: colors.map(function(c){return c}), borderWidth: 1, borderRadius: 4 }] },
      options: { plugins: { legend: { display:false } },
        scales: { y: { beginAtZero:true, ticks: { color:textColor, stepSize:1 }, grid: { color:gridColor } },
                 x: { ticks: { color:textColor } } }
      }
    });

    // Duration Pie
    var durLabels = data.durations.map(function(d){return d.label});
    var durValues = data.durations.map(function(d){return d.count});
    var durColors = ['#00f0ff','#ff00aa','#ffb000','#00ff88','#ff3355','#8866ff','#ff66aa','#66ffcc','#cc8800','#888888'];
    initChart('durationChart', {
      type: 'doughnut',
      plugins: [pctLabelPlugin()],
      data: { labels: durLabels, datasets: [{ data: durValues, backgroundColor: durColors, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }] },
      options: { aspectRatio: 1, plugins: {
        legend: { position:'bottom', labels: { color:textColor, padding:12, font:{size:12} } },
        tooltip: { callbacks: { label: function(ctx){var t=data.total||1;return ctx.label+': '+ctx.parsed+' ('+Math.round(ctx.parsed/t*100)+'%)'} } }
      } }
    });

    // Operator ranking
    var ops = data.topOperators || [];
    if (ops.length) {
      initChart('operatorChart', {
        type: 'bar',
        data: {
          labels: ops.map(function(o){return o.name}),
          datasets: [{ data: ops.map(function(o){return o.count}), backgroundColor: ['#00f0ff','#ff00aa','#ffb000','#66ffcc','#ff3355'], borderWidth: 0, borderRadius: 4 }]
        },
        options: { indexAxis: 'y', aspectRatio: 1.5, plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
                   y: { ticks: { color: textColor } } } }
      });
    }

    // 30-day trend
    var trend = data.dailyTrend || [];
    if (trend.length) {
      initChart('trendChart', {
        type: 'line',
        data: {
          labels: trend.map(function(t){return t.date.slice(5)}),
          datasets: [{ data: trend.map(function(t){return t.count}), borderColor: '#00f0ff', backgroundColor: 'rgba(0,240,255,0.08)', fill: true, tension: 0.3, pointRadius: 2, pointBackgroundColor: '#00f0ff' }]
        },
        options: { aspectRatio: 2, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
                   x: { ticks: { color: textColor, maxTicksLimit: 10 } } } }
      });
    }

    // Duration category bar
    var dc = data.durationCategories || [];
    if (dc.length) {
      initChart('durationCatChart', {
        type: 'bar',
        data: {
          labels: dc.map(function(c){return c.label}),
          datasets: [{ data: dc.map(function(c){return c.count}), backgroundColor: dc.map(function(c){return c.color}), borderWidth: 0, borderRadius: 4 }]
        },
        options: { aspectRatio: 2, plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
                   x: { ticks: { color: textColor } } } }
      });
    }
  });
  </script>

  <div class="charts-row">
    <div class="chart-container glass-card" style="padding:var(--spacing-md);max-width:360px;">
      <div class="chart-section-title">违规等级占比</div>
      <canvas id="levelPieChart"></canvas>
    </div>
    <div class="chart-container glass-card" style="padding:var(--spacing-md);flex:1;">
      <div class="chart-section-title">违规等级分布</div>
      <canvas id="levelBarChart"></canvas>
    </div>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">封禁高峰时段</div>
  <div class="stats-cards-row">
    <div class="glass-card stat-card" style="padding:var(--spacing-lg);text-align:center;">
      <div class="stat-value" style="font-size:32px;font-weight:700;color:var(--cyan);">${props.topDay ? escHtml(props.topDay.label) : '—'}</div>
      <div class="stat-label" style="font-size:12px;color:var(--label-3);margin-top:4px;">封禁最多的日 · ${props.topDay ? props.topDay.count + ' 条' : '暂无数据'}</div>
    </div>
    <div class="glass-card stat-card" style="padding:var(--spacing-lg);text-align:center;">
      <div class="stat-value" style="font-size:32px;font-weight:700;color:var(--blue);">${props.topMonth ? escHtml(props.topMonth.label) : '—'}</div>
      <div class="stat-label" style="font-size:12px;color:var(--label-3);margin-top:4px;">封禁最多的月 · ${props.topMonth ? props.topMonth.count + ' 条' : '暂无数据'}</div>
    </div>
    <div class="glass-card stat-card" style="padding:var(--spacing-lg);text-align:center;">
      <div class="stat-value" style="font-size:32px;font-weight:700;color:var(--warning);">${props.topYear ? escHtml(props.topYear.label) : '—'}</div>
      <div class="stat-label" style="font-size:12px;color:var(--label-3);margin-top:4px;">封禁最多的年 · ${props.topYear ? props.topYear.count + ' 条' : '暂无数据'}</div>
    </div>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">封禁时长偏爱占比</div>
  <div class="chart-container glass-card" style="padding:var(--spacing-md);max-width:360px;">
    <canvas id="durationChart"></canvas>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">操作员封禁排行</div>
  <div class="chart-container glass-card" style="padding:var(--spacing-md);">
    <div id="operatorChartFallback" class="no-data" style="${props.topOperators.length ? 'display:none' : ''}">暂无数据</div>
    <canvas id="operatorChart"></canvas>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">近30天封禁趋势</div>
  <div class="chart-container glass-card" style="padding:var(--spacing-md);">
    <div id="trendChartFallback" class="no-data" style="${props.dailyTrend.length ? 'display:none' : ''}">暂无数据</div>
    <canvas id="trendChart"></canvas>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">封禁时长分类统计</div>
  <div class="chart-container glass-card" style="padding:var(--spacing-md);">
    <div id="durationCatChartFallback" class="no-data" style="${props.durationCategories.length ? 'display:none' : ''}">暂无数据</div>
    <canvas id="durationCatChart"></canvas>
  </div>

</div>`
}
