import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const SAMPLE_JOB_POSTINGS = [
  {
    id: 1,
    from: new Date('2026-06-01'),
    to: new Date('2026-06-30'),
    type: 'full-time',
    description: 'Senior Backend Engineer - Python, Bengaluru. Lead the design and scaling of distributed microservices, asynchronous job queues, and high-throughput REST/gRPC APIs using Python, FastAPI, PostgreSQL, and Redis.',
    company: 'TechCorp Solutions',
    role: 'Senior Backend Engineer - Python',
    location: 'Bengaluru, India',
    techStack: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
  },
  {
    id: 2,
    from: new Date('2026-06-10'),
    to: new Date('2026-07-10'),
    type: 'contract',
    description: 'Data Platform Engineer - streaming pipelines, Remote. Build and maintain real-time telemetry processing pipelines using Apache Kafka, Apache Flink, PySpark, and Google Cloud BigQuery for petabyte-scale event analytics.',
    company: 'Nexus Stream Data',
    role: 'Data Platform Engineer - streaming pipelines',
    location: 'Remote',
    techStack: ['Kafka', 'Flink', 'Python', 'PySpark', 'GCP', 'BigQuery'],
  },
  {
    id: 3,
    from: new Date('2026-06-15'),
    to: new Date('2026-07-15'),
    type: 'full-time',
    description: 'Staff AI/ML Platform Engineer, Hyderabad. Architect GenAI infrastructure, model fine-tuning pipelines, LLM guardrails, and vector search embeddings index utilizing Vertex AI, LangChain, and Pinecone.',
    company: 'Synthetix AI Lab',
    role: 'Staff AI/ML Platform Engineer',
    location: 'Hyderabad, India',
    techStack: ['Python', 'PyTorch', 'Vertex AI', 'LangChain', 'Vector Search', 'GCP'],
  },
  {
    id: 4,
    from: new Date('2026-06-05'),
    to: new Date('2026-07-05'),
    type: 'contract',
    description: 'Full Stack Cloud Architect (React + Node + GCP), Bengaluru. Modernize multi-tenant enterprise portal into serverless Cloud Run microservices with real-time WebSocket notifications and high-concurrency event handling.',
    company: 'Aether Cloud Innovations',
    role: 'Full Stack Cloud Architect',
    location: 'Bengaluru, India',
    techStack: ['React', 'Node.js', 'TypeScript', 'Google Cloud Run', 'PostgreSQL', 'GraphQL'],
  },
  {
    id: 5,
    from: new Date('2026-06-18'),
    to: new Date('2026-07-18'),
    type: 'full-time',
    description: 'DevOps & Site Reliability Engineer (SRE), Pune. Drive zero-downtime infrastructure automation, Terraform IaC, Kubernetes ingress traffic shaping, Prometheus observability, and CI/CD pipelines.',
    company: 'PulseCloud Infrastructure',
    role: 'DevOps & Site Reliability Engineer',
    location: 'Pune, India',
    techStack: ['Kubernetes', 'Terraform', 'GCP', 'Prometheus', 'Grafana', 'GitLab CI'],
  },
  {
    id: 6,
    from: new Date('2026-06-20'),
    to: new Date('2026-07-20'),
    type: 'full-time',
    description: 'Lead Frontend Systems Engineer - Next.js/Tailwind, Mumbai. Build high-performance client rendering pipelines, accessible design system components, and offline-first PWA dashboard for fintech trading clients.',
    company: 'FinPulse Capital',
    role: 'Lead Frontend Systems Engineer',
    location: 'Mumbai, India',
    techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'WebSockets', 'Jest'],
  },
  {
    id: 7,
    from: new Date('2026-06-12'),
    to: new Date('2026-07-12'),
    type: 'contract',
    description: 'Distributed Systems Architect - Go / Distributed Consensus, Remote. Design ultra-low latency transaction engine processing 100k TPS with Raft consensus, gRPC, and RocksDB state storage.',
    company: 'BlockCore Distributed',
    role: 'Distributed Systems Architect',
    location: 'Remote',
    techStack: ['Go', 'gRPC', 'Raft', 'RocksDB', 'Docker', 'Distributed Systems'],
  },
  {
    id: 8,
    from: new Date('2026-06-22'),
    to: new Date('2026-07-22'),
    type: 'full-time',
    description: 'Cybersecurity Threat Intelligence & AppSec Engineer, Gurugram. Implement automated SAST/DAST pipelines, cloud security posture management on GCP, and Zero-Trust identity access architectures.',
    company: 'Fortress Cyber Guard',
    role: 'Cybersecurity AppSec Engineer',
    location: 'Gurugram, India',
    techStack: ['AppSec', 'GCP Security Command Center', 'Python', 'OAuth2', 'Zero Trust'],
  },
  {
    id: 9,
    from: new Date('2026-06-25'),
    to: new Date('2026-07-25'),
    type: 'part-time',
    description: 'Data Scientist - Predictive Career Analytics & NLP, Bengaluru. Build predictive attrition and job match recommendation models using transformers, embeddings, and statistical inference.',
    company: 'TalentSphere Analytics',
    role: 'Data Scientist - Predictive Analytics',
    location: 'Bengaluru, India',
    techStack: ['Python', 'Scikit-Learn', 'Transformers', 'Pandas', 'SQL', 'FastAPI'],
  },
  {
    id: 10,
    from: new Date('2026-06-08'),
    to: new Date('2026-07-08'),
    type: 'full-time',
    description: 'Principal Infrastructure Engineer - Kubernetes & Mesh, Remote. Lead enterprise cloud transformation, Istio service mesh rollout, multi-region failover automation, and cost optimization initiatives.',
    company: 'HyperScale Systems',
    role: 'Principal Infrastructure Engineer',
    location: 'Remote',
    techStack: ['Kubernetes', 'Istio', 'AWS', 'GCP', 'Helm', 'Terraform'],
  },
  {
    id: 11,
    from: new Date('2026-07-01'),
    to: new Date('2026-07-31'),
    type: 'full-time',
    description: 'Mobile Platform Architect - React Native & iOS/Android, Bengaluru. Architect offline-synced cross-platform enterprise mobile applications with biometric security and background telemetry processing.',
    company: 'Apex Mobile Technologies',
    role: 'Mobile Platform Architect',
    location: 'Bengaluru, India',
    techStack: ['React Native', 'TypeScript', 'iOS', 'Android', 'Redux', 'SQLite'],
  },
  {
    id: 12,
    from: new Date('2026-07-05'),
    to: new Date('2026-08-05'),
    type: 'contract',
    description: 'Senior Database Reliability Engineer - PostgreSQL HA, Hyderabad. Specialize in PostgreSQL tuning, Patroni HA clusters, WAL archiving, partitioning large time-series tables, and query optimization.',
    company: 'DataCore Resiliency',
    role: 'Senior Database Reliability Engineer',
    location: 'Hyderabad, India',
    techStack: ['PostgreSQL', 'Patroni', 'PgBouncer', 'Linux', 'Bash', 'Prometheus'],
  }
];

export const SAMPLE_DRAFTS = [
  {
    id: 1,
    jobId: 1,
    type: 'cover_letter',
    contents: 'Dear Hiring Manager - I\'m applying for the Senior Backend Engineer position at TechCorp Solutions. With over 6 years architecting high-scale Python microservices and distributed database backends using FastAPI and PostgreSQL, I specialize in cutting latency and handling high throughput. In my previous role, I reduced p99 query latency by 42% through query optimization and Redis distributed caching. I am excited about TechCorp\'s trajectory and would welcome the opportunity to discuss how my backend expertise can contribute to your engineering goals.',
    status: 'draft',
    atsScore: 92,
    modelUsed: 'gemini-2.5-flash',
  },
  {
    id: 2,
    jobId: 1,
    type: 'follow_up_email',
    contents: 'Following up on my application from June 12 for the Senior Backend Engineer role. I wanted to reiterate my enthusiasm for TechCorp Solutions\' mission and check if there are any updates regarding next steps in the evaluation process. I remain eager to explore how my experience scaling distributed Python pipelines can support your team.',
    status: 'sent',
    atsScore: 88,
    modelUsed: 'gemini-2.5-flash',
  },
  {
    id: 3,
    jobId: 2,
    type: 'cover_letter',
    contents: 'Dear Hiring Team at Nexus Stream Data, I am writing to express my strong interest in the Data Platform Engineer contract role. Having built real-time streaming architectures across Kafka and Apache Flink handling 250k events/sec, I am intimately familiar with pipeline idempotency, checkpoint tuning, and Google Cloud BigQuery streaming ingestion. I would be thrilled to bring these streaming analytics capabilities to Nexus.',
    status: 'reviewed',
    atsScore: 95,
    modelUsed: 'gemini-2.5-flash',
  },
  {
    id: 4,
    jobId: 2,
    type: 'follow_up_email',
    contents: 'Dear Nexus Stream Data Recruiting Team, I hope this week is going well. Following our initial submission on June 15, I wanted to share a brief update: I just published an open-source Flink-to-BigQuery connector benchmark which mirrors the exact architecture described in your job spec. Would love to share insights with the team.',
    status: 'draft',
    atsScore: 90,
    modelUsed: 'gemini-2.5-flash',
  },
  {
    id: 5,
    jobId: 3,
    type: 'cover_letter',
    contents: 'Dear Synthetix AI Talent Team, As an AI/ML Platform Engineer passionate about productionizing generative models, the Staff AI/ML Platform role at Synthetix is a perfect alignment. I have designed LLM inference orchestration layers using Vertex AI and managed vector search databases supporting sub-50ms similarity queries. I look forward to discussing how we can scale enterprise GenAI systems together.',
    status: 'draft',
    atsScore: 94,
    modelUsed: 'gemini-2.5-flash',
  },
  {
    id: 6,
    jobId: 4,
    type: 'cover_letter',
    contents: 'Dear Aether Cloud Innovations Team, I am submitting my application for the Full Stack Cloud Architect position. My background centers on modernizing monolithic services into containerized Cloud Run microservices paired with dynamic React frontends, achieving 99.99% service availability.',
    status: 'draft',
    atsScore: 89,
    modelUsed: 'gemini-2.5-flash',
  }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create or get Demo User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('demo123', salt);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@careeropt.ai' },
    update: {},
    create: {
      email: 'demo@careeropt.ai',
      name: 'Amanpreet Singh (Demo Candidate)',
      passwordHash,
    },
  });

  console.log(`👤 User ready: ${demoUser.email} (${demoUser.id})`);

  // 2. Insert Job Postings
  for (const job of SAMPLE_JOB_POSTINGS) {
    await prisma.jobPosting.upsert({
      where: { id: job.id },
      update: {
        from: job.from,
        to: job.to,
        type: job.type,
        description: job.description,
        company: job.company,
        role: job.role,
        location: job.location,
        techStack: job.techStack,
      },
      create: {
        id: job.id,
        from: job.from,
        to: job.to,
        type: job.type,
        description: job.description,
        company: job.company,
        role: job.role,
        location: job.location,
        techStack: job.techStack,
      },
    });
  }
  console.log(`💼 Seeded ${SAMPLE_JOB_POSTINGS.length} Job Postings.`);

  // 3. Create active Applications across pipeline statuses:
  // Applied, Interview, Offer, Reject
  const applicationConfigs = [
    {
      jobId: 1,
      status: 'Interview',
      appliedDaysAgo: 14,
      interviewDaysFromNow: 2,
      notes: 'Initial technical screening passed on Python data structures. System design interview scheduled.',
    },
    {
      jobId: 2,
      status: 'Applied',
      appliedDaysAgo: 9, // > 7 days triggers follow up nudge!
      interviewDaysFromNow: null,
      notes: 'Submitted resume and portfolio. No response yet after 9 days.',
    },
    {
      jobId: 3,
      status: 'Offer',
      appliedDaysAgo: 25,
      interviewDaysFromNow: null,
      salaryOffer: '$145,000 / yr + Equity',
      notes: 'Received written offer! Reviewing compensation package before final decision deadline.',
    },
    {
      jobId: 4,
      status: 'Applied',
      appliedDaysAgo: 3,
      interviewDaysFromNow: null,
      notes: 'Applied through team referral. Awaiting recruiter contact.',
    },
    {
      jobId: 5,
      status: 'Reject',
      appliedDaysAgo: 30,
      interviewDaysFromNow: null,
      notes: 'Role closed due to internal promotion. Recruiter offered to keep profile active for next quarter.',
    },
    {
      jobId: 6,
      status: 'Interview',
      appliedDaysAgo: 10,
      interviewDaysFromNow: 4,
      notes: 'Take-home frontend assignment submitted. Final round with VP of Engineering.',
    },
  ];

  for (const config of applicationConfigs) {
    const appliedDate = new Date();
    appliedDate.setDate(appliedDate.getDate() - config.appliedDaysAgo);

    let interviewDate: Date | null = null;
    if (config.interviewDaysFromNow !== null) {
      interviewDate = new Date();
      interviewDate.setDate(interviewDate.getDate() + config.interviewDaysFromNow);
    }

    const app = await prisma.application.upsert({
      where: {
        userId_jobPostingId: {
          userId: demoUser.id,
          jobPostingId: config.jobId,
        },
      },
      update: {
        status: config.status,
        appliedDate,
        notes: config.notes,
        interviewDate,
        salaryOffer: config.salaryOffer || null,
      },
      create: {
        userId: demoUser.id,
        jobPostingId: config.jobId,
        status: config.status,
        appliedDate,
        notes: config.notes,
        interviewDate,
        salaryOffer: config.salaryOffer || null,
      },
    });

    // Record initial status transition log
    const existingLog = await prisma.statusTransitionLog.findFirst({
      where: { applicationId: app.id },
    });
    if (!existingLog) {
      await prisma.statusTransitionLog.create({
        data: {
          applicationId: app.id,
          fromStatus: 'Discovered',
          toStatus: config.status,
          changedAt: appliedDate,
          note: `Application transitioned to ${config.status}.`,
        },
      });
    }

    // Add smart automated nudges for testing
    if (config.jobId === 2) {
      // Applied > 7 days ago without response
      await prisma.nudge.create({
        data: {
          applicationId: app.id,
          type: 'follow_up_reminder',
          scheduledDate: new Date(),
          status: 'pending',
          message: 'It has been 9 days since you applied to Nexus Stream Data without a response. Automated follow-up email draft is ready to review and send.',
          triggerReason: 'Application inactive for > 7 days in Applied phase.',
          actionPayload: { suggestedAction: 'send_follow_up', draftId: 4 },
        },
      });
    } else if (config.jobId === 1) {
      // Interview upcoming in 2 days
      await prisma.nudge.create({
        data: {
          applicationId: app.id,
          type: 'prep_interview',
          scheduledDate: new Date(Date.now() + 86400000),
          status: 'pending',
          message: 'System design interview at TechCorp Solutions in 2 days. Review distributed cache invalidation and database sharding patterns.',
          triggerReason: 'Upcoming interview scheduled in 48 hours.',
          actionPayload: { suggestedAction: 'interview_prep', company: 'TechCorp Solutions' },
        },
      });
    } else if (config.jobId === 3) {
      // Offer decision
      await prisma.nudge.create({
        data: {
          applicationId: app.id,
          type: 'offer_decision',
          scheduledDate: new Date(),
          status: 'pending',
          message: 'Written offer from Synthetix AI Lab ($145k + Equity). Decision deadline approaching in 5 days.',
          triggerReason: 'Offer stage active - review compensation checklist.',
          actionPayload: { suggestedAction: 'review_offer' },
        },
      });
    }
  }

  console.log(`📋 Seeded applications across Applied, Interview, Offer, Reject.`);

  // 4. Seed Historical Drafts
  for (const draft of SAMPLE_DRAFTS) {
    const linkedApp = await prisma.application.findFirst({
      where: { jobPostingId: draft.jobId, userId: demoUser.id },
    });

    await prisma.draft.upsert({
      where: { id: draft.id },
      update: {
        jobId: draft.jobId,
        applicationId: linkedApp ? linkedApp.id : null,
        type: draft.type,
        contents: draft.contents,
        status: draft.status,
        atsScore: draft.atsScore,
        modelUsed: draft.modelUsed,
      },
      create: {
        id: draft.id,
        jobId: draft.jobId,
        applicationId: linkedApp ? linkedApp.id : null,
        type: draft.type,
        contents: draft.contents,
        status: draft.status,
        atsScore: draft.atsScore,
        modelUsed: draft.modelUsed,
        analysis: {
          matchedKeywords: ['FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'Vertex AI'],
          toneConfidence: 0.96,
        },
      },
    });
  }
  console.log(`✍️ Seeded ${SAMPLE_DRAFTS.length} historical cover letters and email drafts.`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
