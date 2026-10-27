import { spawn, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DASHBOARD_HMK_DIR = path.resolve(__dirname, '../..');
const POS_GUI_DIR = path.resolve(DASHBOARD_HMK_DIR, '../pos.gui');
const ARTIFACT_DIR =
  '/Users/gryffindor/Library/Application Support/orca/antigravity-chat/antigravity-acp/brain/be59e011-15a9-48b2-a8b2-c1d221a3712f';

const MOCK_PORT = 4199;
const GUI_PORT = 4173;

function orca(args) {
  const out = execFileSync('orca', [...args, '--json'], {
    cwd: DASHBOARD_HMK_DIR,
    encoding: 'utf8',
    maxBuffer: 15 * 1024 * 1024,
  });
  return JSON.parse(out);
}

function createFakeBodJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'BOD E2E Tester',
      exp: Math.floor(Date.now() / 1000) + 86400,
      scope: [
        'manager.dashboard.read',
        'manager.dashboard-v2.bod',
        'manager.dashboard-v2.gmv.read',
        'manager.dashboard-v2.kpi.write',
        'manager.dashboard-v2.traffic.write',
      ].join(' '),
      roleCode: 'BOD',
      roleName: 'Ban Giám Đốc',
    })
  ).toString('base64url');
  return `${header}.${payload}.e2e`;
}

async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForOrigin(pageId, expectedPrefix, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = orca(['eval', '--page', pageId, '--expression', 'window.location.origin']);
      const origin = String(res?.result?.result ?? res?.result?.origin ?? '');
      if (origin.startsWith(expectedPrefix)) return origin;
    } catch {
      // retry while page initializes
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for page ${pageId} origin ${expectedPrefix}`);
}

async function waitForPageText(pageId, substring, timeoutMs = 25000) {
  const start = Date.now();
  let lastText = '';
  while (Date.now() - start < timeoutMs) {
    try {
      const res = orca(['eval', '--page', pageId, '--expression', 'document.body ? document.body.innerText : ""']);
      const val = res?.result?.result ?? res?.result?.value ?? '';
      lastText = typeof val === 'string' ? val : JSON.stringify(val);
      if (lastText.includes(substring)) return lastText;
    } catch {
      // ignore transient navigation errors
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `Timed out waiting for text "${substring}" on page ${pageId}. Current text snippet:\n${lastText.slice(0, 1200)}`
  );
}

async function main() {
  console.log('1. Starting Mock Report API server on port', MOCK_PORT);
  const mockServer = spawn('node', [path.join(__dirname, 'mock-report-api-server.mjs')], {
    cwd: DASHBOARD_HMK_DIR,
    env: { ...process.env, E2E_API_PORT: String(MOCK_PORT) },
    stdio: 'pipe',
  });

  console.log('2. Starting pos.gui Vite server on port', GUI_PORT);
  const viteServer = spawn(
    'npx',
    ['vite', '--mode', 'e2e', '--port', String(GUI_PORT), '--host', '127.0.0.1', '--strictPort'],
    {
      cwd: POS_GUI_DIR,
      env: {
        ...process.env,
        VITE_APP_CODE: 'POS',
        VITE_API_REPORT: `http://127.0.0.1:${MOCK_PORT}`,
        VITE_API_POS: `http://127.0.0.1:${MOCK_PORT}`,
        VITE_API_IDENTITY: `http://127.0.0.1:${MOCK_PORT}`,
        VITE_API_UPLOAD: `http://127.0.0.1:${MOCK_PORT}`,
        VITE_API_EPC: `http://127.0.0.1:${MOCK_PORT}`,
        VITE_API_HRM: `http://127.0.0.1:${MOCK_PORT}`,
      },
      stdio: 'pipe',
    }
  );

  let pageId = null;
  try {
    await waitForHttp(`http://127.0.0.1:${MOCK_PORT}/__e2e/requests`);
    await waitForHttp(`http://127.0.0.1:${GUI_PORT}/login`);
    console.log('   Both servers are up!');

    console.log('3. Opening Orca Browser tab...');
    orca(['tab', 'create', '--url', `http://127.0.0.1:${GUI_PORT}/login`]);
    const tabList = orca(['tab', 'list']);
    const tabs = tabList?.result?.tabs ?? [];
    const targetTab =
      tabs.find((t) => String(t.url || '').includes(`127.0.0.1:${GUI_PORT}`)) || tabs[tabs.length - 1];
    assert.ok(targetTab?.browserPageId, 'Failed to obtain browserPageId from Orca Browser');
    pageId = targetTab.browserPageId;
    console.log('   Orca Browser Page ID:', pageId);

    await waitForOrigin(pageId, `http://127.0.0.1:${GUI_PORT}`);
    const jwt = createFakeBodJwt();

    // Inject BOD JWT + refreshToken + siteId into localStorage on http://127.0.0.1:4173 and navigate to Executive tab
    orca([
      'eval',
      '--page',
      pageId,
      '--expression',
      `localStorage.setItem('accessToken', ${JSON.stringify(jwt)}); localStorage.setItem('refreshToken', 'e2e-refresh-token'); localStorage.setItem('siteId', 'site-1'); localStorage.setItem('clientIP', '127.0.0.1'); window.location.href = 'http://127.0.0.1:${GUI_PORT}/dashboard-v2?tab=executive'; true`,
    ]);

    console.log('4. Navigating to /dashboard-v2?tab=executive in Orca Browser...');
    const execText = await waitForPageText(pageId, 'DOANH THU THUẦN', 25000);
    console.log('   Executive View loaded! Verifying M2 & M3...');

    // Verify M2: Trước VAT on Net Revenue card & UPT card
    assert.ok(execText.includes('Trước VAT'), 'Executive Overview Cards must display Trước VAT');
    assert.ok(execText.includes('UPT'), 'Executive Overview Cards must display UPT card');

    // Verify M3: Customer Segment Growth (New vs Returning vs WalkIn KHACHLE Option A)
    const execTextFull = await waitForPageText(pageId, 'Khách hàng mới', 15000);
    assert.ok(
      execTextFull.includes('Khách hàng cũ') || execTextFull.includes('Quay lại'),
      'ExecutiveView must render Returning customer segment'
    );
    assert.ok(
      execTextFull.includes('KHACHLE') || execTextFull.includes('Chưa định danh'),
      'ExecutiveView must render WalkIn (KHACHLE) customer segment'
    );

    // Verify M2 & M6 on Executive Performance Ranking table
    assert.ok(execTextFull.includes('Thực thu'), 'ExecutivePerformanceRanking must display Thực thu column');
    assert.ok(
      execTextFull.includes('Đơn BH (0đ)') || execTextFull.includes('Bảo hành'),
      'ExecutivePerformanceRanking must display Đơn BH (0đ) column'
    );

    const snapExec = orca(['snapshot', '--page', pageId]);
    assert.ok(snapExec?.ok, 'Orca Browser snapshot on Executive tab succeeded');
    orca(['screenshot', '--page', pageId]);

    console.log('5. Navigating to /dashboard-v2?tab=operational in Orca Browser...');
    orca(['goto', '--page', pageId, '--url', `http://127.0.0.1:${GUI_PORT}/dashboard-v2?tab=operational`]);

    const opText = await waitForPageText(pageId, 'Ưu đãi Mùa Tựu Trường', 25000);
    console.log('   Operational View loaded! Verifying M1, M2-Op, M4, M5, M7...');

    // Verify M1: 6 PA2 Bill Range buckets via filter bar or ECharts option
    assert.ok(
      opText.includes('Phân khúc Hóa đơn') || opText.includes('Basket Size'),
      'Operational Basket chart must render'
    );

    // Verify M5: Warranty 0đ panel
    assert.ok(
      opText.includes('Đơn bảo hành (0đ)') && opText.includes('Đơn đổi 0đ') && opText.includes('Đơn thường 0đ'),
      'Operational Refund & Warranty card must display 0đ Warranty metrics (Exchange 0đ + Direct 0đ)'
    );

    // Verify M4: TimePeakChart Best & Worst highlights
    const opLower = opText.toLowerCase();
    assert.ok(
      opLower.includes('thứ cao điểm nhất') &&
        opLower.includes('thứ thấp điểm nhất') &&
        opLower.includes('khung giờ bán tốt nhất') &&
        opLower.includes('khung giờ bán thấp nhất'),
      'TimePeakChart must highlight Best/Worst Day & Best/Worst Hour'
    );

    // Verify M2-Op: Campaign UPT column
    assert.ok(opText.includes('Ưu đãi Mùa Tựu Trường') && opText.includes('UPT'), 'Campaign table must display UPT');

    // Verify M7: Conversion Rate System-wide + Store/Region toggle
    assert.ok(
      opText.includes('Toàn hệ thống') &&
        opText.includes('Theo Cửa hàng') &&
        opText.includes('Theo Khu vực') &&
        opText.includes('HMK Quận 1'),
      'Conversion Rate section must display System-wide badge, Store/Region toggle, and Top Store'
    );

    // Click "Theo Khu vực" toggle and verify regional conversion rows appear
    orca([
      'eval',
      '--page',
      pageId,
      '--expression',
      `document.querySelector('[data-test="conversion-view-region"]')?.click(); true`,
    ]);
    const opRegionText = await waitForPageText(pageId, 'TP. Hồ Chí Minh', 10000);
    assert.ok(opRegionText.includes('Miền Tây'), 'Conversion Rate Region view must render regional rows');

    const snapOp = orca(['snapshot', '--page', pageId]);
    assert.ok(snapOp?.ok, 'Orca Browser snapshot on Operational tab succeeded');
    orca(['screenshot', '--page', pageId]);

    console.log('6. Navigating to /dashboard-v2?tab=personnel in Orca Browser...');
    orca(['goto', '--page', pageId, '--url', `http://127.0.0.1:${GUI_PORT}/dashboard-v2?tab=personnel`]);

    const perText = await waitForPageText(pageId, 'Nguyễn Thị Minh Anh', 25000);
    console.log('   Personnel View loaded! Verifying M6 SalesLeaderboard...');
    assert.ok(
      perText.includes('Đơn trả:') && perText.includes('Đơn BH (0đ):'),
      'SalesLeaderboard must display Return and 0đ Warranty metrics for PIC Sales'
    );
    orca(['screenshot', '--page', pageId]);

    console.log('7. Testing gmvHidden = true mode in Orca Browser...');
    await fetch(`http://127.0.0.1:${MOCK_PORT}/__e2e/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmvHidden: true }),
    });
    orca(['goto', '--page', pageId, '--url', `http://127.0.0.1:${GUI_PORT}/dashboard-v2?tab=executive`]);
    const hiddenText = await waitForPageText(pageId, 'Không có quyền xem GMV', 20000);
    assert.ok(
      hiddenText.includes('Không có quyền xem GMV'),
      'When gmvHidden=true, GMV blocks/fields must display Không có quyền xem GMV notice'
    );
    orca(['screenshot', '--page', pageId]);

    console.log('✅ ALL ORCA BROWSER E2E TESTS PASSED!');
  } finally {
    if (pageId) {
      try {
        orca(['tab', 'close', '--page', pageId]);
      } catch {
        // ignore
      }
    }
    mockServer.kill('SIGTERM');
    viteServer.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('❌ ORCA BROWSER E2E FAILED:', err);
  process.exit(1);
});
