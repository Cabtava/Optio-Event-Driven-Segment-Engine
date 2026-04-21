import { PrismaClient, SegmentType, EvaluationTriggerType, DeltaChangeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.segmentDeltaItem.deleteMany();
  await prisma.segmentDelta.deleteMany();
  await prisma.segmentMembershipCurrent.deleteMany();
  await prisma.segmentDependency.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.customer.deleteMany();

  const now = new Date();

  const customers = await prisma.customer.createMany({
    data: [
      { name: 'Giorgi M.', email: 'giorgi@example.com', city: 'Batumi', status: 'active' },
      { name: 'Nino K.', email: 'nino@example.com', city: 'Tbilisi', status: 'active' },
      { name: 'Lasha T.', email: 'lasha@example.com', city: 'Kutaisi', status: 'inactive' },
      { name: 'Mariam D.', email: 'mariam@example.com', city: 'Batumi', status: 'active' },
      { name: 'Ana G.', email: 'ana@example.com', city: 'Tbilisi', status: 'active' },
      { name: 'Saba R.', email: 'saba@example.com', city: 'Zugdidi', status: 'inactive' },
      { name: 'Dato P.', email: 'dato@example.com', city: 'Batumi', status: 'active' },
      { name: 'Tako J.', email: 'tako@example.com', city: 'Kutaisi', status: 'active' },
    ],
  });

  const allCustomers = await prisma.customer.findMany();

  const customerByEmail = Object.fromEntries(allCustomers.map((c) => [c.email, c]));

  await prisma.transaction.createMany({
    data: [
      {
        customerId: customerByEmail['giorgi@example.com'].id,
        amount: '120.00',
        occurredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['giorgi@example.com'].id,
        amount: '200.00',
        occurredAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['nino@example.com'].id,
        amount: '3500.00',
        occurredAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['nino@example.com'].id,
        amount: '2200.00',
        occurredAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['mariam@example.com'].id,
        amount: '100.00',
        occurredAt: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['ana@example.com'].id,
        amount: '7000.00',
        occurredAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['dato@example.com'].id,
        amount: '50.00',
        occurredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customerByEmail['tako@example.com'].id,
        amount: '5200.00',
        occurredAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const activeBuyers = await prisma.segment.create({
    data: {
      name: 'Active Buyers',
      type: SegmentType.DYNAMIC,
      ruleJson: {
        op: 'and',
        conditions: [
          {
            field: 'transactions_count_30d',
            operator: '>=',
            value: 1,
          },
        ],
      },
      lastSnapshotVersion: 1,
      lastEvaluatedAt: now,
    },
  });

  const vipCustomers = await prisma.segment.create({
    data: {
      name: 'VIP Customers',
      type: SegmentType.DYNAMIC,
      ruleJson: {
        op: 'and',
        conditions: [
          {
            field: 'spend_sum_60d',
            operator: '>',
            value: 5000,
          },
        ],
      },
      lastSnapshotVersion: 1,
      lastEvaluatedAt: now,
    },
  });

  const riskGroup = await prisma.segment.create({
    data: {
      name: 'Risk Group',
      type: SegmentType.DYNAMIC,
      ruleJson: {
        op: 'and',
        conditions: [
          {
            field: 'days_since_last_transaction',
            operator: '>=',
            value: 90,
          },
          {
            field: 'had_any_transaction_before',
            operator: '=',
            value: true,
          },
        ],
      },
      lastSnapshotVersion: 1,
      lastEvaluatedAt: now,
    },
  });

  const vipAtRisk = await prisma.segment.create({
    data: {
      name: 'VIP At Risk',
      type: SegmentType.DYNAMIC,
      ruleJson: {
        op: 'and',
        conditions: [
          {
            type: 'segment_ref',
            segmentName: 'VIP Customers',
          },
          {
            type: 'segment_ref',
            segmentName: 'Risk Group',
          },
        ],
      },
      lastSnapshotVersion: 1,
      lastEvaluatedAt: now,
    },
  });

  const marchCampaign = await prisma.segment.create({
    data: {
      name: 'March Campaign Audience',
      type: SegmentType.FROZEN,
      ruleJson: {
        op: 'and',
        conditions: [
          {
            field: 'city',
            operator: 'in',
            value: ['Batumi', 'Tbilisi'],
          },
        ],
      },
      lastSnapshotVersion: 1,
      lastEvaluatedAt: now,
    },
  });

  await prisma.segmentDependency.createMany({
    data: [
      {
        segmentId: vipAtRisk.id,
        dependsOnSegmentId: vipCustomers.id,
      },
      {
        segmentId: vipAtRisk.id,
        dependsOnSegmentId: riskGroup.id,
      },
    ],
  });

  const activeBuyerMembers = [
    customerByEmail['giorgi@example.com'].id,
    customerByEmail['nino@example.com'].id,
    customerByEmail['dato@example.com'].id,
    customerByEmail['tako@example.com'].id,
  ];

  const vipMembers = [
    customerByEmail['nino@example.com'].id,
    customerByEmail['tako@example.com'].id,
  ];

  const riskMembers = [
    customerByEmail['mariam@example.com'].id,
    customerByEmail['ana@example.com'].id,
  ];

  const vipAtRiskMembers: string[] = [];

  const marchCampaignMembers = [
    customerByEmail['giorgi@example.com'].id,
    customerByEmail['nino@example.com'].id,
    customerByEmail['mariam@example.com'].id,
    customerByEmail['ana@example.com'].id,
    customerByEmail['dato@example.com'].id,
  ];

  const membershipRows = [
    ...activeBuyerMembers.map((customerId) => ({
      segmentId: activeBuyers.id,
      customerId,
    })),
    ...vipMembers.map((customerId) => ({
      segmentId: vipCustomers.id,
      customerId,
    })),
    ...riskMembers.map((customerId) => ({
      segmentId: riskGroup.id,
      customerId,
    })),
    ...vipAtRiskMembers.map((customerId) => ({
      segmentId: vipAtRisk.id,
      customerId,
    })),
    ...marchCampaignMembers.map((customerId) => ({
      segmentId: marchCampaign.id,
      customerId,
    })),
  ];

  await prisma.segmentMembershipCurrent.createMany({
    data: membershipRows,
  });

  const initialDeltas = [
    {
      segment: activeBuyers,
      members: activeBuyerMembers,
      addedCount: activeBuyerMembers.length,
      removedCount: 0,
    },
    {
      segment: vipCustomers,
      members: vipMembers,
      addedCount: vipMembers.length,
      removedCount: 0,
    },
    {
      segment: riskGroup,
      members: riskMembers,
      addedCount: riskMembers.length,
      removedCount: 0,
    },
    {
      segment: vipAtRisk,
      members: vipAtRiskMembers,
      addedCount: vipAtRiskMembers.length,
      removedCount: 0,
    },
    {
      segment: marchCampaign,
      members: marchCampaignMembers,
      addedCount: marchCampaignMembers.length,
      removedCount: 0,
    },
  ];

  for (const entry of initialDeltas) {
    const delta = await prisma.segmentDelta.create({
      data: {
        segmentId: entry.segment.id,
        fromVersion: 0,
        toVersion: 1,
        addedCount: entry.addedCount,
        removedCount: entry.removedCount,
        triggerType: EvaluationTriggerType.INITIAL_SEED,
      },
    });

    if (entry.members.length > 0) {
      await prisma.segmentDeltaItem.createMany({
        data: entry.members.map((customerId) => ({
          deltaId: delta.id,
          customerId,
          changeType: DeltaChangeType.ADDED,
        })),
      });
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });