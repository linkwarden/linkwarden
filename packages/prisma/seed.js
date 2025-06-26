// A dirty script to seed the database with some data

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const defaultPassword = "11111111";
  const hashedPassword = bcrypt.hashSync(defaultPassword, saltRounds);

  // Subscription dates
  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 10);

  // Operations to be executed within a transaction
  const transaction = await prisma.$transaction(async (prisma) => {
    // Create users with subscriptions
    const user1 = await prisma.user.create({
      data: {
        name: "John Doe",
        username: "user1",
        email: "user1@example.com",
        emailVerified: new Date(),
        password: hashedPassword,
        subscriptions: {
          create: {
            stripeSubscriptionId: "sub_4323",
            active: true,
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
        dashboardSections: {
          createMany: {
            data: [
              {
                order: 0,
                type: "STATS",
              },
              {
                order: 1,
                type: "RECENT_LINKS",
              },
              {
                order: 2,
                type: "PINNED_LINKS",
              },
            ],
          },
        },
      },
    });

    const user2 = await prisma.user.create({
      data: {
        name: "Mary Smith",
        username: "user2",
        email: "user2@example.com",
        emailVerified: new Date(),
        password: hashedPassword,
        subscriptions: {
          create: {
            stripeSubscriptionId: "sub_5435",
            active: true,
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
        dashboardSections: {
          createMany: {
            data: [
              {
                order: 0,
                type: "STATS",
              },
              {
                order: 1,
                type: "RECENT_LINKS",
              },
              {
                order: 2,
                type: "PINNED_LINKS",
              },
            ],
          },
        },
      },
    });

    const user3 = await prisma.user.create({
      data: {
        name: "Linda Jones",
        username: "user3",
        email: "user3@example.com",
        emailVerified: new Date(),
        password: hashedPassword,
        subscriptions: {
          create: {
            stripeSubscriptionId: "sub_6435",
            active: true,
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
        dashboardSections: {
          createMany: {
            data: [
              {
                order: 0,
                type: "STATS",
              },
              {
                order: 1,
                type: "RECENT_LINKS",
              },
              {
                order: 2,
                type: "PINNED_LINKS",
              },
            ],
          },
        },
      },
    });

    const user4 = await prisma.user.create({
      data: {
        name: "Betty Sanchez",
        username: "user4",
        email: "user4@example.com",
        emailVerified: new Date(),
        password: hashedPassword,
        subscriptions: {
          create: {
            stripeSubscriptionId: "sub_7868",
            active: true,
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
        dashboardSections: {
          createMany: {
            data: [
              {
                order: 0,
                type: "STATS",
              },
              {
                order: 1,
                type: "RECENT_LINKS",
              },
              {
                order: 2,
                type: "PINNED_LINKS",
              },
            ],
          },
        },
      },
    });

    const user5 = await prisma.user.create({
      data: {
        name: "Jeffrey Edwards",
        username: "user5",
        email: "user5@example.com",
        emailVerified: new Date(),
        password: hashedPassword,
        subscriptions: {
          create: {
            stripeSubscriptionId: "sub_5653",
            active: true,
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
        dashboardSections: {
          createMany: {
            data: [
              {
                order: 0,
                type: "STATS",
              },
              {
                order: 1,
                type: "RECENT_LINKS",
              },
              {
                order: 2,
                type: "PINNED_LINKS",
              },
            ],
          },
        },
      },
    });

    // Define and create collections
    const collectionsUser1 = [
      {
        name: "Health and Wellness",
        description: "Latest articles on health and wellness.",
        ownerId: user1.id,
        color: "#ff1100",
      },
      {
        name: "Research and Studies",
        description: "Latest articles on research and studies.",
        ownerId: user1.id,
        color: "#000dff",
      },
      {
        name: "Technology",
        description: "Latest articles on technology.",
        ownerId: user1.id,
        color: "#0080ff",
      },
      {
        name: "Personal Finance",
        description: "Latest articles on personal finance.",
        ownerId: user1.id,
        color: "#00ff40",
      },
      {
        name: "Productivity",
        description: "Latest articles on productivity.",
        ownerId: user1.id,
        color: "#ff00f7",
      },
      {
        name: "Recipes",
        description: "Latest recipes.",
        ownerId: user1.id,
        color: "#eeff00",
      },
    ];

    const collectionsUser2 = [
      {
        name: "Project Alpha",
        description: "Articles for Project Alpha.",
        ownerId: user2.id,
      },
    ];

    const user1Collections = await Promise.all(
      collectionsUser1.map((c) => prisma.collection.create({ data: c }))
    );

    const user2Collections = await Promise.all(
      collectionsUser2.map((c) => prisma.collection.create({ data: c }))
    );

    // Share one collection between users with permissions
    await Promise.allSettled([
      prisma.usersAndCollections.create({
        data: {
          userId: user1.id,
          collectionId: user2Collections[0].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user2.id,
          collectionId: user1Collections[1].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user3.id,
          collectionId: user1Collections[1].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user4.id,
          collectionId: user1Collections[1].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user5.id,
          collectionId: user1Collections[1].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user2.id,
          collectionId: user2Collections[0].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user3.id,
          collectionId: user2Collections[0].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
      prisma.usersAndCollections.create({
        data: {
          userId: user2.id,
          collectionId: user1Collections[0].id,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        },
      }),
    ]);

    let projectAlphaCollection = await prisma.collection.findFirst({
      where: {
        name: "Project Alpha",
        ownerId: user2.id,
      },
    });

    const projectAlphaLinks = [
      {
        name: "More than 10,000 research papers were retracted in 2023 — a new record",
        url: "https://www.nature.com/articles/d41586-023-03974-8",
      },
      {
        name: "Advances in Liver Cancer Research",
        url: "https://www.cancer.gov/types/liver/research",
      },
      {
        name: "NEW RESEARCH REVEALS TOP AI TOOLS UTILIZED BY MUSIC PRODUCERS",
        url: "https://edm.com/gear-tech/top-ai-tools-music-producers",
      },
      {
        name: "New Google research: What we now know about 'decoding' consumer decision-making",
        url: "https://www.thinkwithgoogle.com/intl/en-emea/consumer-insights/consumer-journey/the-consumer-decision-making-process/",
      },
      {
        name: "Drug Overdose Death Rates",
        url: "https://nida.nih.gov/research-topics/trends-statistics/overdose-death-rates",
      },
      {
        name: "Explore the latest research making an impact in your field",
        url: "https://biologue.plos.org/2023/10/25/latest-biological-science-research/",
      },
    ];

    for (const link of projectAlphaLinks) {
      await prisma.link.create({
        data: {
          name: link.name,
          url: link.url,
          collectionId: projectAlphaCollection.id,
          createdById: user2.id,
        },
      });
    }

    for (const [collectionName, links] of Object.entries(linksAndCollections)) {
      let collection = await prisma.collection.findFirst({
        where: {
          name: collectionName,
          ownerId: user1.id,
        },
      });

      if (!collection) {
        collection = await prisma.collection.create({
          data: {
            name: collectionName,
            ownerId: user1.id,
          },
        });
      }

      for (const link of links) {
        await prisma.link.create({
          data: {
            name: link.name,
            url: link.url,
            description: link.description,
            tags: {
              connectOrCreate: link.tags.map((tag) => ({
                where: {
                  name_ownerId: {
                    name: tag.name,
                    ownerId: user1.id,
                  },
                },
                create: {
                  name: tag.name,
                  ownerId: user1.id,
                },
              })),
            },
            collectionId: collection.id,
            createdById: user1.id,
          },
        });
      }
    }
  });

  return transaction;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Sample data (generated by ChatGPT...)
const linksAndCollections = {
  "Health and Wellness": [
    {
      name: "12 Evidence-Based Benefits of Meditation",
      description:
        "An in-depth look at how regular meditation can reduce stress, improve focus, and boost overall mental health, with scientific studies backing each claim.",
      url: "https://www.healthline.com/nutrition/12-benefits-of-meditation",
      tags: [{ name: "wellness" }, { name: "mindfulness" }],
    },
    {
      name: "Complete Guide to Intermittent Fasting",
      description:
        "Covers the various methods of intermittent fasting, its effects on weight loss, metabolic health, and common pitfalls—plus tips for getting started safely.",
      url: "https://www.healthline.com/nutrition/intermittent-fasting-guide",
      tags: [{ name: "wellness" }, { name: "nutrition" }],
    },
    {
      name: "How to Get a Better Night’s Sleep",
      description:
        "Practical, expert-backed strategies—from sleep hygiene to relaxation techniques—to help you fall asleep faster and stay asleep longer.",
      url: "https://www.sleepfoundation.org/sleep-hygiene/healthy-sleep-tips",
      tags: [{ name: "wellness" }, { name: "mindfulness" }],
    },
    {
      name: "10 Science-Backed Benefits of Yoga",
      description:
        "Explores how yoga can improve flexibility, reduce anxiety, and promote heart health, with references to dozens of clinical trials.",
      url: "https://www.healthline.com/nutrition/13-benefits-of-yoga",
      tags: [{ name: "fitness" }, { name: "mindfulness" }],
    },
    {
      name: "Beginner’s Guide to Plant-Based Eating",
      description:
        "Everything you need to know to start a plant-based diet: what to eat, potential health benefits, and meal-planning tips to ensure balanced nutrition.",
      url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/vegetarian-diet/art-20046446",
      tags: [{ name: "nutrition" }, { name: "wellness" }],
    },
    {
      name: "7 Proven Ways to Boost Your Immunity",
      description:
        "Evidence-based lifestyle and nutritional changes—like sleep, exercise, and specific micronutrients—that can strengthen your body’s defense system.",
      url: "https://www.health.harvard.edu/staying-healthy/7-tips-to-boost-your-immune-system",
      tags: [{ name: "wellness" }, { name: "nutrition" }],
    },
    {
      name: "The Truth About Sugar and Your Health",
      description:
        "Breaks down how different types of sugar affect your body, links to chronic disease, and realistic strategies to cut down without feeling deprived.",
      url: "https://www.cdc.gov/nutrition/data-statistics/know-your-limit-for-added-sugars.html",
      tags: [{ name: "nutrition" }, { name: "wellness" }],
    },
    {
      name: "Mindful Eating: A Complete Beginner’s Guide",
      description:
        "Learn the principles of mindful eating, how it can help control overeating, and simple exercises to apply at every meal.",
      url: "https://www.mindful.org/mindful-eating-a-guide-to-rediscovering-a-healthy-and-joyful-relationship-with-food/",
      tags: [{ name: "mindfulness" }, { name: "nutrition" }],
    },
    {
      name: "5 Everyday Exercises for Stronger Bones",
      description:
        "Descriptions and photos of simple weight-bearing and resistance exercises proven to increase bone density and reduce osteoporosis risk.",
      url: "https://www.webmd.com/osteoporosis/ss/slideshow-bone-strengthening-exercises",
      tags: [{ name: "fitness" }, { name: "wellness" }],
    },
    {
      name: "The Role of Gut Health in Overall Wellness",
      description:
        "An overview of the gut-brain axis, how microbiome imbalances contribute to disease, and dietary tips to foster a healthy gut community.",
      url: "https://www.healthline.com/nutrition/gut-microbiome-and-health",
      tags: [{ name: "wellness" }, { name: "nutrition" }],
    },
    {
      name: "Stress Management Techniques That Work",
      description:
        "Evidence-based tactics—from breathing exercises to cognitive reframing—designed to lower cortisol levels and improve resilience.",
      url: "https://www.apa.org/topics/stress/tips",
      tags: [{ name: "wellness" }, { name: "mindfulness" }],
    },
    {
      name: "How Much Water Should You Really Drink?",
      description:
        "Separates fact from fiction on daily water intake, factors that influence your hydration needs, and signs you’re not drinking enough.",
      url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/expert-answers/water/faq-20058593",
      tags: [{ name: "nutrition" }, { name: "wellness" }],
    },
    {
      name: "Top 10 Superfoods for Longevity",
      description:
        "A curated list of nutrient-dense foods—like berries, leafy greens, and fatty fish—that are linked to longer, healthier lives.",
      url: "https://www.health.harvard.edu/staying-healthy/the-top-10-superfoods-for-longevity",
      tags: [{ name: "nutrition" }, { name: "wellness" }],
    },
    {
      name: "How to Create a Personalized Workout Plan",
      description:
        "Step-by-step instructions for designing a balanced exercise regimen based on your goals, fitness level, and available equipment.",
      url: "https://www.acefitness.org/education-and-resources/lifestyle/exercise-library/workout-planner/",
      tags: [{ name: "fitness" }, { name: "wellness" }],
    },
    {
      name: "10 Signs You’re Headed for Burnout",
      description:
        "Key emotional, physical, and behavioral warning signs of burnout, plus practical strategies to recover and prevent a future relapse.",
      url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/stress/workplace-stress-and-burnout/",
      tags: [{ name: "wellness" }, { name: "mindfulness" }],
    },
    {
      name: "Balanced Nutrition for Busy Professionals",
      description:
        "Quick meal prep ideas, grocery lists, and nutrient-focused recipes to keep energy levels steady even on the busiest days.",
      url: "https://www.eatright.org/health/wellness/healthy-living/quick-and-easy-healthy-meal-ideas",
      tags: [{ name: "nutrition" }, { name: "wellness" }],
    },
    {
      name: "Natural Remedies for Common Ailments",
      description:
        "Explores herbal teas, essential oils, and other evidence-supported natural treatments for headaches, insomnia, and mild colds.",
      url: "https://www.medicalnewstoday.com/articles/324144",
      tags: [{ name: "wellness" }, { name: "nutrition" }],
    },
    {
      name: "The Science of Habit Formation",
      description:
        "Delve into how habits are formed in the brain, the role of cues and rewards, and tips for building healthy routines that stick.",
      url: "https://jamesclear.com/habits-science",
      tags: [{ name: "mindfulness" }, { name: "wellness" }],
    },
    {
      name: "Managing Anxiety: Tools and Techniques",
      description:
        "A toolkit of breathing exercises, journaling prompts, and CBT-based techniques shown to reduce anxiety symptoms in clinical trials.",
      url: "https://www.anxietycanada.com/articles/5-cbt-tools-for-anxiety/",
      tags: [{ name: "mindfulness" }, { name: "wellness" }],
    },
    {
      name: "Why Strength Training Matters at Any Age",
      description:
        "Benefits of resistance exercise for bone health, metabolism, and functional fitness, plus sample routines for all age groups.",
      url: "https://www.nia.nih.gov/news/why-strength-training-matters-any-age",
      tags: [{ name: "fitness" }, { name: "wellness" }],
    },
  ],
  "Research and Studies": [
    {
      name: "CRISPR Gene Editing: A Revolutionary Tool",
      description:
        "Overview of CRISPR-Cas9 technology, its applications in disease treatment, and ethical considerations for its use in humans.",
      url: "https://www.nature.com/articles/d41586-020-00502-w",
      tags: [{ name: "research" }, { name: "science" }],
    },
    {
      name: "Meta-Analysis of Mediterranean Diet Effects",
      description:
        "Combines data from multiple trials to show how adherence to a Mediterranean diet reduces cardiovascular risk and inflammation.",
      url: "https://www.sciencedirect.com/science/article/pii/S0899900720301293",
      tags: [{ name: "research" }, { name: "nutrition" }],
    },
    {
      name: "AI Models Predict Protein Folding",
      description:
        "Details AlphaFold’s approach to accurately predict 3D protein structures and its implications for drug discovery.",
      url: "https://www.nature.com/articles/s41586-021-03819-2",
      tags: [{ name: "research" }, { name: "technology" }],
    },
    {
      name: "Global Warming Trends Since 1880",
      description:
        "Analysis of temperature data over 140 years showing accelerating global temperature rise and its regional impacts.",
      url: "https://www.nature.com/articles/s41558-020-0807-0",
      tags: [{ name: "research" }, { name: "environment" }],
    },
    {
      name: "Neuroscience of Memory Consolidation",
      description:
        "Explores how sleep stages influence memory encoding and consolidation, with insights from human EEG and rodent studies.",
      url: "https://www.cell.com/cell/fulltext/S0092-8674(20)31849-5",
      tags: [{ name: "research" }, { name: "science" }],
    },
    {
      name: "Quantum Supremacy Achieved",
      description:
        "Describes Google’s 53-qubit Sycamore processor performing a computation beyond classical supercomputers’ reach.",
      url: "https://www.nature.com/articles/s41586-019-1666-5",
      tags: [{ name: "research" }, { name: "technology" }],
    },
    {
      name: "Gut Microbiome’s Role in Obesity",
      description:
        "Identifies specific bacterial strains linked to weight gain and explores probiotic interventions tested in clinical trials.",
      url: "https://www.pnas.org/content/118/30/e2021563118",
      tags: [{ name: "research" }, { name: "nutrition" }],
    },
    {
      name: "Language Development in Infancy",
      description:
        "Longitudinal study tracking how early exposure to language sounds shapes neural circuits for speech perception.",
      url: "https://www.science.org/doi/10.1126/science.abf4150",
      tags: [{ name: "research" }, { name: "science" }],
    },
    {
      name: "Nanoparticle Drug Delivery Advances",
      description:
        "Review of recent designs for targeted nanoparticle carriers that improve cancer chemotherapy efficacy and reduce side effects.",
      url: "https://www.advancedsciencenews.com/review-nanoparticle-drug-delivery/",
      tags: [{ name: "research" }, { name: "science" }],
    },
    {
      name: "Renewable Energy Storage Solutions",
      description:
        "Evaluates battery chemistries and grid-scale storage options essential for integrating solar and wind power.",
      url: "https://www.nature.com/articles/s41560-020-00736-7",
      tags: [{ name: "research" }, { name: "technology" }],
    },
    {
      name: "Psychological Effects of Social Media",
      description:
        "Meta-analysis linking heavy social media use to anxiety and depression in adolescents, with recommendations for healthy usage.",
      url: "https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2770149",
      tags: [{ name: "research" }, { name: "wellness" }],
    },
    {
      name: "Advances in Solid-State Batteries",
      description:
        "Reports breakthroughs in solid electrolytes that promise safer, higher-energy-density batteries for EVs.",
      url: "https://www.nature.com/articles/s41560-021-00962-8",
      tags: [{ name: "research" }, { name: "technology" }],
    },
    {
      name: "Microplastics in the Marine Food Web",
      description:
        "Documents how microplastic particles accumulate up trophic levels, from plankton to fish, and potential human health risks.",
      url: "https://www.sciencedirect.com/science/article/pii/S0025326X20300206",
      tags: [{ name: "research" }, { name: "environment" }],
    },
    {
      name: "Brain-Computer Interfaces: Current State",
      description:
        "Overview of implanted and non-invasive BCIs, recent clinical trials restoring motor control in paralyzed patients.",
      url: "https://www.nature.com/articles/s41551-020-00648-4",
      tags: [{ name: "research" }, { name: "technology" }],
    },
    {
      name: "Global Economic Impact of Pandemics",
      description:
        "Models comparing GDP losses across different outbreak scenarios and evaluates mitigation policies’ cost-effectiveness.",
      url: "https://www.brookings.edu/research/the-economic-impact-of-pandemics/",
      tags: [{ name: "research" }, { name: "finance" }],
    },
    {
      name: "Photovoltaic Efficiency Records",
      description:
        "Summarizes recent perovskite–silicon tandem solar cells achieving >30% conversion efficiency and their scalability challenges.",
      url: "https://www.nrel.gov/news/program/2020/perovskite-silicon-tandem-cells.html",
      tags: [{ name: "research" }, { name: "technology" }],
    },
    {
      name: "CRISPR-Based Diagnostics for COVID-19",
      description:
        "Describes rapid, point-of-care CRISPR assays that detect SARS-CoV-2 RNA with high sensitivity and minimal equipment.",
      url: "https://www.cell.com/cell/fulltext/S0092-8674(20)31210-3",
      tags: [{ name: "research" }, { name: "science" }],
    },
    {
      name: "Gene Therapy for Rare Diseases",
      description:
        "Reviews approved and experimental viral-vector gene therapies, their therapeutic targets, and long-term safety data.",
      url: "https://www.nejm.org/doi/full/10.1056/NEJMra2000065",
      tags: [{ name: "research" }, { name: "science" }],
    },
    {
      name: "AI-Driven Climate Prediction Models",
      description:
        "Evaluates how machine learning improves the accuracy of regional climate forecasts and extreme event predictions.",
      url: "https://www.nature.com/articles/s41467-020-18031-5",
      tags: [{ name: "research" }, { name: "technology" }],
    },
  ],
  Technology: [
    {
      name: "The Rise of Foldable Smartphones",
      description:
        "Examines the engineering challenges and consumer reception of the latest foldable display devices from major brands.",
      url: "https://www.theverge.com/2025/5/12/foldable-phone-review",
      tags: [{ name: "technology" }],
    },
    {
      name: "AI Ethics: Balancing Innovation and Responsibility",
      description:
        "Discusses frameworks for ethical AI development, from data bias mitigation to transparent model explainability.",
      url: "https://www.wired.com/story/ai-ethics-responsibility-frameworks/",
      tags: [{ name: "technology" }],
    },
    {
      name: "5G Rollout: What You Need to Know",
      description:
        "Breaks down how 5G network architecture works, expected coverage timelines, and real-world performance benchmarks.",
      url: "https://www.cnet.com/features/5g-rollout-explained/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Quantum Internet: The Next Frontier",
      description:
        "Explores early experiments in quantum entanglement for communication and the technical hurdles to a secure quantum internet.",
      url: "https://www.technologyreview.com/2025/04/01/quantum-internet-progress/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Edge Computing vs. Cloud Computing",
      description:
        "Compares latency, cost, and security trade-offs between edge and centralized cloud architectures for IoT applications.",
      url: "https://www.forbes.com/sites/forbestechcouncil/2025/03/15/edge-vs-cloud-computing/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Biometric Authentication: Pros and Cons",
      description:
        "Analyzes fingerprint, facial, and iris recognition systems’ accuracy, privacy implications, and spoofing vulnerabilities.",
      url: "https://arstechnica.com/gadgets/2025/02/biometric-authentication-security-review/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Neural Interfaces for Enhanced Reality",
      description:
        "Covers brain-computer interface demos that overlay digital information directly onto human perception pathways.",
      url: "https://www.theverge.com/2025/04/brain-computer-interface-ar",
      tags: [{ name: "technology" }],
    },
    {
      name: "Electric Vehicle Battery Innovations",
      description:
        "Details breakthroughs in solid-state and lithium-sulfur batteries that promise longer range and faster charging.",
      url: "https://www.greencarreports.com/news/2025-battery-innovation/",
      tags: [{ name: "technology" }],
    },
    {
      name: "OpenAI’s New GPT-5: Capabilities Overview",
      description:
        "Summarizes GPT-5’s architecture improvements, multilingual fluency, and real-world benchmark performances.",
      url: "https://openai.com/research/gpt-5-overview",
      tags: [{ name: "technology" }],
    },
    {
      name: "The Future of Wearable Health Tech",
      description:
        "Explores sensor breakthroughs in smartwatches and earbuds that can monitor blood pressure, glucose, and sleep stages.",
      url: "https://www.wired.com/story/future-wearable-health-tech/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Advances in Robotics and Automation",
      description:
        "Profiles agile, dexterous robots from startups and how they’re transforming manufacturing and logistics.",
      url: "https://spectrum.ieee.org/robotics-automation-2025",
      tags: [{ name: "technology" }],
    },
    {
      name: "Metaverse Platforms Compared",
      description:
        "Evaluates leading virtual world platforms on graphics fidelity, social features, and developer toolkits.",
      url: "https://www.techradar.com/news/metaverse-platform-comparison-2025",
      tags: [{ name: "technology" }],
    },
    {
      name: "Cybersecurity Threats in 2025",
      description:
        "Outlines emerging attack vectors—from AI-generated phishing to supply-chain vulnerabilities—and mitigation strategies.",
      url: "https://www.kaspersky.com/blog/cybersecurity-trends-2025/38123/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Satellite Internet: Starlink vs. Competitors",
      description:
        "Benchmarks latency, bandwidth, and coverage of low-earth orbit internet constellations for rural connectivity.",
      url: "https://www.techrepublic.com/article/starlink-vs-competitors/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Nanotech in Consumer Electronics",
      description:
        "Reviews how nanoscale materials enable foldable screens, high-capacity batteries, and improved thermal management.",
      url: "https://www.scientificamerican.com/article/nanotech-consumer-electronics-2025/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Blockchain Beyond Cryptocurrency",
      description:
        "Examines real-world blockchain use cases in supply chain, identity management, and decentralized governance.",
      url: "https://www.coindesk.com/learn/blockchain-use-cases-2025/",
      tags: [{ name: "technology" }],
    },
    {
      name: "AI-Powered Code Generators: Prospects and Risks",
      description:
        "Discusses how tools like GitHub Copilot accelerate development and potential pitfalls around code security and bias.",
      url: "https://www.infoq.com/articles/ai-code-generation-trends/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Zero-Trust Network Architecture Explained",
      description:
        "Guides IT teams on implementing zero-trust principles—continuous verification, least privilege, and microsegmentation.",
      url: "https://www.sans.org/white-papers/zero-trust-architecture/",
      tags: [{ name: "technology" }],
    },
    {
      name: "Autonomous Drone Delivery Trials",
      description:
        "Reports on pilot programs testing regulatory frameworks, BVLOS operations, and safety protocols for drone delivery.",
      url: "https://www.dronepilotinsight.com/delivery-trials-2025/",
      tags: [{ name: "technology" }],
    },
  ],
  "Personal Finance": [
    {
      name: "Beginner’s Guide to Investing in Index Funds",
      description:
        "Explains how index funds work, their advantages over active management, and steps to get started with minimal fees.",
      url: "https://www.investopedia.com/articles/investing/052915/guide-index-funds.asp",
      tags: [{ name: "finance" }, { name: "investing" }],
    },
    {
      name: "How to Build an Emergency Fund Quickly",
      description:
        "Strategies for saving 3–6 months of expenses, including budgeting hacks and side-income ideas to accelerate your goal.",
      url: "https://www.nerdwallet.com/article/finance/how-to-build-an-emergency-fund",
      tags: [{ name: "finance" }, { name: "saving" }],
    },
    {
      name: "Understanding Credit Scores and Reports",
      description:
        "Breaks down FICO and VantageScore models, how behaviors affect scores, and tips to improve credit health.",
      url: "https://www.experian.com/blogs/ask-experian/credit-education/score-basics/what-is-a-good-credit-score/",
      tags: [{ name: "finance" }, { name: "credit" }],
    },
    {
      name: "Tax-Advantaged Retirement Accounts Explained",
      description:
        "Compares IRAs, 401(k)s, and Roth options, covering contribution limits, tax treatments, and withdrawal rules.",
      url: "https://www.fidelity.com/retirement-ira/roth-ira-vs-traditional-ira",
      tags: [{ name: "finance" }, { name: "retirement" }],
    },
    {
      name: "How to Pay Off Debt with the Snowball Method",
      description:
        "Step-by-step guide to listing debts smallest to largest, directing extra payments strategically, and staying motivated.",
      url: "https://www.daveramsey.com/blog/the-debt-snowball-method",
      tags: [{ name: "finance" }, { name: "debt" }],
    },
    {
      name: "Building Wealth with Real Estate Crowdfunding",
      description:
        "Introduces platforms that let you invest small amounts in commercial real estate projects for passive income.",
      url: "https://www.investopedia.com/real-estate-crowdfunding-4783327",
      tags: [{ name: "finance" }, { name: "investing" }],
    },
    {
      name: "Maximizing Credit Card Rewards",
      description:
        "Techniques to optimize points, miles, and cash-back bonuses while avoiding interest and fees.",
      url: "https://www.forbes.com/advisor/credit-cards/maximize-rewards/",
      tags: [{ name: "finance" }, { name: "credit" }],
    },
    {
      name: "Understanding Cryptocurrency Investing",
      description:
        "Overview of Bitcoin, Ethereum, DeFi tokens, and strategies for balancing risk and reward in crypto portfolios.",
      url: "https://www.coindesk.com/learn/crypto-investing-for-beginners/",
      tags: [{ name: "finance" }, { name: "investing" }],
    },
    {
      name: "The Psychology of Money: Behavioral Biases",
      description:
        "Explores how loss aversion, overconfidence, and herd behavior influence financial decisions, with mitigation tactics.",
      url: "https://www.behaviouralfinance.net/articles/psychology-of-money/",
      tags: [{ name: "finance" }],
    },
    {
      name: "Passive Income Ideas for 2025",
      description:
        "Lists opportunities like dividend investing, peer-to-peer lending, and digital products that can generate income with minimal upkeep.",
      url: "https://www.nerdwallet.com/article/investing/passive-income-ideas",
      tags: [{ name: "finance" }, { name: "investing" }],
    },
    {
      name: "How to Save for a Down Payment on a Home",
      description:
        "Budgeting worksheets, high-yield savings options, and first-time homebuyer programs to reach your goal faster.",
      url: "https://www.bankrate.com/mortgages/how-to-save-for-down-payment/",
      tags: [{ name: "finance" }, { name: "saving" }],
    },
    {
      name: "ETF vs. Mutual Fund: Which Is Right for You?",
      description:
        "Compares liquidity, fees, and tax implications of ETFs versus mutual funds to help you choose the best investment vehicle.",
      url: "https://www.investopedia.com/articles/investing/092915/etf-vs-mutual-fund.asp",
      tags: [{ name: "finance" }, { name: "investing" }],
    },
    {
      name: "Budgeting 101: Zero-Based Budget Explained",
      description:
        "Details how to assign every dollar a job in your monthly budget to eliminate waste and reach financial goals.",
      url: "https://www.nerdwallet.com/article/finance/zero-based-budget",
      tags: [{ name: "finance" }, { name: "budgeting" }],
    },
    {
      name: "Roth IRA vs. Traditional IRA: Pros and Cons",
      description:
        "Breaks down tax treatment at contribution and withdrawal stages, and who benefits most from each account type.",
      url: "https://www.bankrate.com/retirement/roth-ira-vs-traditional-ira/",
      tags: [{ name: "finance" }, { name: "retirement" }],
    },
    {
      name: "Navigating Student Loan Repayment Plans",
      description:
        "Compares income-driven, standard, and graduated repayment options, and tips to minimize interest over time.",
      url: "https://studentaid.gov/manage-loans/repayment/plans",
      tags: [{ name: "finance" }, { name: "debt" }],
    },
    {
      name: "Understanding Mortgage Refinancing",
      description:
        "When and how to refinance your home loan to lower rates, shorten terms, or tap equity without high closing costs.",
      url: "https://www.consumerfinance.gov/ask-cfpb/what-is-refinancing-a-mortgage-en-123/",
      tags: [{ name: "finance" }, { name: "mortgage" }],
    },
    {
      name: "Protecting Yourself from Identity Theft",
      description:
        "Actionable steps—like credit freezes, monitoring services, and secure password practices—to guard your financial identity.",
      url: "https://www.identitytheft.gov/Steps-to-recover-from-identity-theft",
      tags: [{ name: "finance" }, { name: "security" }],
    },
    {
      name: "Health Savings Accounts: Tax Benefits Explained",
      description:
        "Outlines HSA eligibility, contribution limits, and how to use tax-free withdrawals for qualified medical expenses.",
      url: "https://www.hsacentral.com/hsa-basics/",
      tags: [{ name: "finance" }, { name: "tax" }],
    },
    {
      name: "Travel Hacking: Maximizing Airline Miles",
      description:
        "Strategies to earn and redeem miles efficiently, credit card combos, and insider tips to upgrade flights for free.",
      url: "https://www.thepointsguys.com/guide/travel-hacking-miles-2025/",
      tags: [{ name: "finance" }, { name: "travel" }],
    },
  ],
  Productivity: [
    {
      name: "The Pomodoro Technique: Time Management Simplified",
      description:
        "Step-by-step guide to using 25-minute focused work intervals with short breaks to boost concentration and avoid burnout.",
      url: "https://francescocirillo.com/pages/pomodoro-technique",
      tags: [{ name: "productivity" }, { name: "time management" }],
    },
    {
      name: "Getting Things Done: The Ultimate Workflow",
      description:
        "David Allen’s GTD methodology for capturing, clarifying, organizing, reflecting on, and engaging with your tasks.",
      url: "https://gettingthingsdone.com/what-is-gtd/",
      tags: [{ name: "productivity" }, { name: "workflow" }],
    },
    {
      name: "5 Apps to Supercharge Your To-Do List",
      description:
        "Reviews top task-management apps—like Todoist, Trello, and Notion—with feature comparisons and pricing details.",
      url: "https://www.lifewire.com/best-to-do-list-apps-4144636",
      tags: [{ name: "productivity" }, { name: "tools" }],
    },
    {
      name: "How to Build Deep Work Habits",
      description:
        "Strategies from Cal Newport on creating uninterrupted time blocks for cognitively demanding tasks.",
      url: "https://www.calnewport.com/books/deep-work/",
      tags: [{ name: "productivity" }, { name: "focus" }],
    },
    {
      name: "Batch Processing: Grouping Similar Tasks",
      description:
        "Explains how grouping email, errands, and creative work into batches reduces context switching and saves time.",
      url: "https://zapier.com/blog/batching-tasks-productivity/",
      tags: [{ name: "productivity" }, { name: "workflow" }],
    },
    {
      name: "Bullet Journal Method for Personal Organization",
      description:
        "How to use rapid logging, collections, and migration in a simple notebook system to track your life and goals.",
      url: "https://bulletjournal.com/pages/learn",
      tags: [{ name: "productivity" }, { name: "organization" }],
    },
    {
      name: "Time Blocking: Structure Your Day",
      description:
        "Guide to allocating fixed time slots for tasks, meetings, and breaks to maintain focus and avoid over-scheduling.",
      url: "https://todoist.com/productivity-methods/time-blocking",
      tags: [{ name: "productivity" }, { name: "time management" }],
    },
    {
      name: "Overcoming Procrastination: Science-Backed Tips",
      description:
        "Techniques like temptation bundling, implementation intentions, and the two-minute rule to beat delay tactics.",
      url: "https://www.apa.org/news/press/releases/2020/12/procrastination-self-control",
      tags: [{ name: "productivity" }, { name: "mindset" }],
    },
    {
      name: "Minimalism for a Decluttered Mind",
      description:
        "Applying minimalist principles to your workspace and digital life to reduce distractions and decision fatigue.",
      url: "https://www.becomingminimalist.com/benefits-of-minimalism/",
      tags: [{ name: "productivity" }, { name: "organization" }],
    },
    {
      name: "Using Eisenhower Matrix to Prioritize Tasks",
      description:
        "Learn to sort tasks by urgency and importance into four quadrants to ensure you’re working on what truly matters.",
      url: "https://www.mindtools.com/pages/article/newHTE_90.htm",
      tags: [{ name: "productivity" }, { name: "workflow" }],
    },
    {
      name: "5-Minute Daily Reflection Rituals",
      description:
        "Short journaling prompts and mindfulness exercises to review wins, lessons learned, and plan tomorrow’s focus.",
      url: "https://www.mindful.org/5-minute-mindfulness-practices/",
      tags: [{ name: "productivity" }, { name: "mindfulness" }],
    },
    {
      name: "Streamlining Email with Inbox Zero",
      description:
        "Tactics to process, archive, or delete every email to maintain an organized inbox and reduce mental clutter.",
      url: "https://www.lifehacker.com/how-to-achieve-inbox-zero-when-you-cant-ignore-new-1847128928",
      tags: [{ name: "productivity" }, { name: "workflow" }],
    },
    {
      name: "Kanban Boards for Visual Task Tracking",
      description:
        "Introduction to kanban principles and how digital or physical boards can visualize work in progress and bottlenecks.",
      url: "https://kanbanize.com/kanban-resources/getting-started/what-is-kanban",
      tags: [{ name: "productivity" }, { name: "workflow" }],
    },
    {
      name: "Digital Detox: Regain Your Focus",
      description:
        "Guidelines for scheduled breaks from screens, social media fasts, and app blockers to restore attention spans.",
      url: "https://www.commonsensemedia.org/articles/digital-detox",
      tags: [{ name: "productivity" }, { name: "mindfulness" }],
    },
    {
      name: "Automate Repetitive Tasks with Zapier",
      description:
        "Examples of workflows—like auto-saving attachments or syncing CRM data—that can be built without code.",
      url: "https://zapier.com/learn/automate-tasks-with-zapier/",
      tags: [{ name: "productivity" }, { name: "tools" }],
    },
    {
      name: "Mastering Keyboard Shortcuts to Save Time",
      description:
        "Lists essential shortcuts for Windows, macOS, and popular apps to reduce reliance on mouse clicks.",
      url: "https://www.makeuseof.com/tag/keyboard-shortcuts-unleash-productivity/",
      tags: [{ name: "productivity" }, { name: "tools" }],
    },
    {
      name: "Pomodoro-Style Break Exercises",
      description:
        "Quick desk stretches and mobility routines to recharge your body and mind during Pomodoro breaks.",
      url: "https://www.healthline.com/health/office-exercises",
      tags: [{ name: "productivity" }, { name: "wellness" }],
    },
    {
      name: "Set SMART Goals for Maximum Productivity",
      description:
        "Framework for Specific, Measurable, Achievable, Relevant, and Time-bound goal setting to guide daily actions.",
      url: "https://www.mindtools.com/pages/article/smart-goals.htm",
      tags: [{ name: "productivity" }, { name: "planning" }],
    },
  ],
  Recipes: [
    {
      name: "Classic Margherita Pizza",
      description:
        "Step-by-step instructions for a homemade Neapolitan-style Margherita with fresh mozzarella, basil, and a blistered crust.",
      url: "https://www.foodnetwork.com/recipes/food-network-kitchen/margherita-pizza-recipe-2011795",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Creamy Chicken Alfredo Pasta",
      description:
        "Rich, homemade Alfredo sauce made with butter, cream, and Parmesan, tossed with tender chicken and fettuccine.",
      url: "https://www.delish.com/uk/recipes/healthy/g30656269/chicken-alfredo-recipe/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Vegan Lentil Shepherd’s Pie",
      description:
        "Hearty lentil-mushroom base topped with creamy mashed potatoes for a plant-based twist on a classic.",
      url: "https://www.bbcgoodfood.com/recipes/vegan-lentil-shepherds-pie",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "30-Minute Stir-Fry Noodles",
      description:
        "Quick wok-tossed noodles with crisp vegetables and a savory soy-garlic sauce for a weeknight dinner.",
      url: "https://www.bonappetit.com/recipe/30-minute-stir-fry-noodles",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Gluten-Free Banana Pancakes",
      description:
        "Simple batter using oats and ripe bananas for fluffy gluten-free pancakes that stay together perfectly.",
      url: "https://minimalistbaker.com/gluten-free-banana-pancakes/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Sheet Pan Salmon and Vegetables",
      description:
        "All-in-one dinner with salmon fillets and colorful veggies roasted on a single sheet pan with lemon-herb seasoning.",
      url: "https://www.eatingwell.com/recipe/275995/sheet-pan-salmon-and-vegetables/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Homemade Beef Chili",
      description:
        "Slow-simmered chili with ground beef, beans, tomatoes, and warming spices, perfect for topping with cheese and sour cream.",
      url: "https://www.allrecipes.com/recipe/229960/the-best-chili-ever/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Classic Hummus from Scratch",
      description:
        "Creamy chickpea dip blended with tahini, garlic, and lemon, plus tips for achieving silky texture every time.",
      url: "https://www.foodnetwork.com/recipes/food-network-kitchen/classic-hummus-recipe-2119884",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "One-Pot Creamy Mushroom Risotto",
      description:
        "Arborio rice cooked with mushrooms, white wine, and Parmesan in a single pot for an easy, elegant side or main.",
      url: "https://www.bbcgoodfood.com/recipes/one-pot-mushroom-risotto",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Avocado Toast with Poached Egg",
      description:
        "Toasted sourdough topped with mashed avocado, chili flakes, and a perfectly poached egg for a balanced brunch.",
      url: "https://www.loveandlemons.com/poached-eggs-on-toast/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Spicy Shrimp Tacos with Mango Salsa",
      description:
        "Crispy shrimp tossed in chili-lime seasoning, served in tortillas with fresh mango salsa and cilantro crema.",
      url: "https://www.delish.com/cooking/recipe-ideas/a24814922/spicy-shrimp-tacos-with-mango-salsa-recipe/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Vegetarian Thai Green Curry",
      description:
        "Aromatic curry made with green curry paste, coconut milk, and mixed vegetables, served over jasmine rice.",
      url: "https://www.recipetineats.com/thai-green-curry/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "No-Bake Chocolate Oat Bars",
      description:
        "Energy-boosting snack bars made with oats, nut butter, honey, and topped with a chocolate layer—no oven required.",
      url: "https://www.twopeasandtheirpod.com/no-bake-oatmeal-bars/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Garlic Butter Steak Bites",
      description:
        "Tender cubes of steak seared with garlic butter and parsley, perfect as a quick appetizer or main dish.",
      url: "https://www.delish.com/uk/cooking/recipes/g30653610/garlic-butter-steak-bites-recipe/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Vegan Buddha Bowl with Tahini Dressing",
      description:
        "Colorful bowl of quinoa, roasted veggies, and chickpeas topped with creamy tahini-lemon dressing.",
      url: "https://www.feastingathome.com/buddha-bowl-recipe/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Greek Yogurt Parfait with Granola",
      description:
        "Layers of creamy Greek yogurt, honey, fresh berries, and crunchy granola for a balanced breakfast or snack.",
      url: "https://www.loveandlemons.com/yogurt-parfait/",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Roasted Garlic and Tomato Soup",
      description:
        "Slow-roasted tomatoes and garlic blended into a rich soup, finished with a swirl of basil oil.",
      url: "https://www.foodnetwork.com/recipes/food-network-kitchen/roasted-garlic-tomato-soup-3362670",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Homemade Sourdough Bread",
      description:
        "Step-by-step sourdough starter care, dough shaping, and steam baking for crusty, tangy loaves at home.",
      url: "https://www.kingarthurbaking.com/recipes/classic-sourdough-bread-recipe",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
    {
      name: "Chickpea and Spinach Curry",
      description:
        "Quick Indian-inspired curry with chickpeas, spinach, and coconut milk served over basmati rice.",
      url: "https://www.bbcgoodfood.com/recipes/chickpea-spinach-curry",
      tags: [{ name: "cooking" }, { name: "recipe" }],
    },
  ],
};
