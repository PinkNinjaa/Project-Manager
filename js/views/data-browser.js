import { icon } from '../components/icons.js';
import { pageHeader } from '../components/ui.js';

export async function render() {
  return {
    title: 'Data Browser',
    breadcrumbs: [{ label: 'Data Browser' }],
    html: `${pageHeader({
      eyebrow: 'TigerTurf',
      title: 'Data Browser',
      subtitle: 'Browse and manage the TigerTurf database tables, reports, and query tools.',
      actions: `<a class="btn btn--secondary" href="#/pipeline">${icon('bar-chart')}Opportunity pipeline</a>`
    })}
    <div class="card data-browser-card">
      <iframe
        class="data-browser-frame"
        src="/DataModel/public/index.html"
        title="TigerTurf database browser"
        loading="lazy"
      ></iframe>
    </div>`
  };
}
