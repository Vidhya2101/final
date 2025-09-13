const studentFees = [
    { studentId: 'S001', amount: 150000 }, { studentId: 'S002', amount: 155000 },
    { studentId: 'S003', amount: 165000 }, { studentId: 'S004', amount: 150000 },
    { studentId: 'S005', amount: 170000 }, { studentId: 'S006', amount: 150000 },
    { studentId: 'S007', amount: 180000 }, { studentId: 'S008', amount: 160000 },
    { studentId: 'S009', amount: 152000 }, { studentId: 'S010', amount: 175000 },
    { studentId: 'S011', amount: 168000 }, { studentId: 'S012', amount: 150000 },
];

const totalFees = studentFees.reduce((sum, fee) => sum + fee.amount, 0);

const initialUsers = [
    { email: 'admin@trusttrail.com', password: 'password123', role: 'College Admin' },
    { email: 'student@trusttrail.com', password: 'password123', role: 'Student' }
];

const initialLedgerData = [
    {
        from: 'Student Fees Collection',
        to: 'College Main Budget',
        amount: totalFees,
        type: 'income',
        description: `Total fees collected from ${studentFees.length} students for the 2025 academic year.`
    },
    {
        from: 'College Main Budget',
        to: 'Academics Department',
        amount: 550000,
        type: 'budget',
        description: 'Annual budget for all academic activities, faculty salaries, and resources.',
        anomalyThreshold: 577500 // 5% buffer
    },
    {
        from: 'College Main Budget',
        to: 'Infrastructure & Security',
        amount: 350000,
        type: 'budget',
        description: 'Budget for campus maintenance, utilities, and security services.',
        anomalyThreshold: 367500 // 5% buffer
    },
    {
        from: 'College Main Budget',
        to: 'Student Affairs & Sports',
        amount: 250000,
        type: 'budget',
        description: 'Funding for student clubs, events, sports, and wellness programs.',
        anomalyThreshold: 262500 // 5% buffer
    },
    {
        from: 'Academics Department',
        to: 'TechNext Solutions (Laptops)',
        amount: 185000,
        type: 'expense',
        description: 'Purchase of 200 new laptops for computer labs.',
    },
    {
        from: 'Infrastructure & Security',
        to: 'SecureCorp Services',
        amount: 150000,
        type: 'expense',
        description: 'Annual campus security contract.',
    },
    {
        from: 'Student Affairs & Sports',
        to: 'Innovate Events Management',
        amount: 95000,
        type: 'expense',
        description: 'Management of the annual college cultural festival.',
    },
    {
        from: 'Academics Department',
        to: 'Global Publishers Ltd.',
        amount: 70000,
        type: 'expense',
        description: 'Annual subscription for library journals and e-books.',
    },
    {
        from: 'Infrastructure & Security',
        to: 'GreenScape Landscaping',
        amount: 60000,
        type: 'expense',
        description: 'Campus grounds maintenance contract for 6 months.',
    },
    {
        from: 'Student Affairs & Sports',
        to: 'SportsGear Inc.',
        amount: 110000,
        type: 'expense',
        description: 'New equipment for football, basketball, and cricket teams.',
    },
];

module.exports = { studentFees, initialLedgerData, initialUsers };

