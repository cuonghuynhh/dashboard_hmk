export const BRANCH_TO_REGION: Record<string, string> = {
  'HMK HN Chi nhánh 1': 'Miền Bắc',
  'HMK HN Chi nhánh 5': 'Miền Bắc',
  'HMK ĐN Chi nhánh 2': 'Miền Trung',
  'HMK BD Chi nhánh 3': 'Miền Nam',
  'HMK Chi nhánh 4': 'Miền Nam',
};

export const REGIONS = ['Tất cả Khu vực', 'Miền Bắc', 'Miền Trung', 'Miền Nam'];
export const ALL_BRANCHES = Object.keys(BRANCH_TO_REGION);

export const getBranchesByRegion = (region: string) => {
  if (region === 'Tất cả Khu vực') return ['Tất cả Chi nhánh', ...ALL_BRANCHES];
  return ['Tất cả Chi nhánh', ...ALL_BRANCHES.filter(b => BRANCH_TO_REGION[b] === region)];
};
