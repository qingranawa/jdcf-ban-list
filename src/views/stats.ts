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
}

export function StatsPage(props: StatsData) {
  const dataJson = JSON.stringify(props).replace(/<\//g, '<\\/')
  return html`
<div class="cyber-page" style="max-width:900px;margin:0 auto;padding:var(--spacing-xl) var(--spacing-md) var(--spacing-lg);">

  <h1 class="cyber-title" style="font-size:32px;margin-bottom:var(--spacing-xs);">统计信息</h1>
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
            meta.data.forEach(function(el,j){
              var v=ds.data[j], p=v/t*100;
              if(p<4) return;
              ctx.fillStyle='#000';
              ctx.font='bold 13px sans-serif';
              ctx.textAlign='center';
              ctx.textBaseline='middle';
              ctx.fillText(Math.round(p)+'%',el.x,el.y);
            });
          });
        }
      };
    }

    // Pie
    initChart('levelPieChart', {
      type: 'doughnut',
      plugins: [pctLabelPlugin()],
      data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#000', borderWidth: 2 }] },
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
      data: { labels: durLabels, datasets: [{ data: durValues, backgroundColor: durColors, borderColor: '#000', borderWidth: 2 }] },
      options: { aspectRatio: 1, plugins: {
        legend: { position:'bottom', labels: { color:textColor, padding:12, font:{size:12} } },
        tooltip: { callbacks: { label: function(ctx){var t=data.total||1;return ctx.label+': '+ctx.parsed+' ('+Math.round(ctx.parsed/t*100)+'%)'} } }
      } }
    });
  });
  </script>

  <div class="charts-row">
    <div class="chart-container cyber-card" style="padding:var(--spacing-md);max-width:360px;">
      <div class="chart-section-title">违规等级占比</div>
      <canvas id="levelPieChart"></canvas>
    </div>
    <div class="chart-container cyber-card" style="padding:var(--spacing-md);flex:1;">
      <div class="chart-section-title">违规等级分布</div>
      <canvas id="levelBarChart"></canvas>
    </div>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">封禁高峰时段</div>
  <div class="stats-cards-row">
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-cyan">${props.topDay ? escHtml(props.topDay.label) : '—'}</div>
      <div class="cyber-stat-label">封禁最多的日 · ${props.topDay ? props.topDay.count + ' 条' : '暂无数据'}</div>
    </div>
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-magenta">${props.topMonth ? escHtml(props.topMonth.label) : '—'}</div>
      <div class="cyber-stat-label">封禁最多的月 · ${props.topMonth ? props.topMonth.count + ' 条' : '暂无数据'}</div>
    </div>
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-amber">${props.topYear ? escHtml(props.topYear.label) : '—'}</div>
      <div class="cyber-stat-label">封禁最多的年 · ${props.topYear ? props.topYear.count + ' 条' : '暂无数据'}</div>
    </div>
  </div>

  <div class="chart-section-title" style="margin-top:var(--spacing-lg);">封禁时长偏爱占比</div>
  <div class="chart-container cyber-card" style="padding:var(--spacing-md);max-width:360px;">
    <canvas id="durationChart"></canvas>
  </div>

</div>`
}
