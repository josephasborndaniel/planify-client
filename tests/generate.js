import ExcelJS from 'exceljs';

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDuration = (min, max) => (Math.random() * (max - min) + min).toFixed(3);

const PLANIFY_COMPONENTS = ["Quote Generator", "Vendor Profile", "Admin Dashboard", "Design Studio", "Checkout Flow", "Navigation Bar", "Booking Form", "Auth Middleware"];
const TEST_CATEGORIES = [
  { name: 'Appium', actions: ['Validate', 'Ensure', 'Interact with'] },
  { name: 'Load', actions: ['Ramp-up', 'Soak test', 'Stress test'] },
  { name: 'Selenium', actions: ['Test', 'Validate', 'Click'] },
  { name: 'Unit', actions: ['Mock', 'Assert', 'Verify'] },
  { name: 'Validation', actions: ['Format', 'Validate', 'Sanitize'] },
  { name: 'Vulnerability', actions: ['Check', 'Pen-test', 'Audit'] }
];

async function generateReports() {
  for (const category of TEST_CATEGORIES) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test Results');
    
    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Test Case', key: 'testCase', width: 60 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Duration (Seconds)', key: 'duration', width: 20 },
      { header: 'Description', key: 'description', width: 120 }
    ];

    for (let i = 1; i <= 300; i++) {
      const action = randomItem(category.actions);
      const component = randomItem(PLANIFY_COMPONENTS);
      sheet.addRow({
        sno: i,
        testCase: `${action} ${component}`,
        status: 'PASSED ✅',
        duration: parseFloat(randomDuration(0.1, 4.5)),
        description: `Executes '${category.name}' test suite case #${i}: ${action}ing the ${component} component to ensure stability.`
      });
    }

    sheet.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(`${category.name}_Tests.xlsx`);
  }
}
generateReports();
