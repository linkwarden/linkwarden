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
        name: "Research",
        description: "Latest articles on research.",
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
            collectionId: collection.id,
          },
        });
      }
    }

    const tags = [
      { name: "technology", ownerId: user1.id },
      { name: "finance", ownerId: user1.id },
      { name: "future", ownerId: user1.id },
      { name: "health", ownerId: user1.id },
      { name: "hacks", ownerId: user1.id },
      { name: "lifestyle", ownerId: user1.id },
      { name: "routine", ownerId: user1.id },
      { name: "personal", ownerId: user1.id },
    ];
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

const linksAndCollections = {
  "Health and Wellness": [
    {
      name: "50 Wellness Gifts for Anyone Who Could Use Some Self-Care",
      url: "https://www.self.com/gallery/healthy-gift-ideas-for-wellness-gurus",
    },
    {
      name: "Hearing aids slow cognitive decline in people at high risk",
      url: "https://www.nih.gov/news-events/nih-research-matters/hearing-aids-slow-cognitive-decline-people-high-risk",
    },
    {
      name: "Why Are Healthy Habits Important at Work and Home?",
      url: "https://info.totalwellnesshealth.com/blog/why-are-healthy-habits-important",
    },
    {
      name: "Wellness Travel BC explores shifting travel trends as health and wellness take center stage for Canadians",
      url: "https://www.vancouverisawesome.com/sponsored/wellness-travel-bc-explores-shifting-travel-trends-as-health-and-wellness-take-center-stage-for-canadians-8004505",
    },
    {
      name: "50 Wellness Gifts for Anyone Who Could Use Some Self-Care",
      url: "https://www.self.com/gallery/healthy-gift-ideas-for-wellness-gurus",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
  ],
  Research: [
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
    {
      name: "Example",
      url: "https://example.com",
    },
  ],
  Technology: [
    {
      name: "These six questions will dictate the future of generative AI",
      url: "https://www.technologyreview.com/2023/12/19/1084505/generative-ai-artificial-intelligence-bias-jobs-copyright-misinformation/",
    },
    {
      name: "Q&A: People will only use technology they trust, Microsoft expert says",
      url: "https://www.euronews.com/next/2023/12/21/qa-people-will-only-use-technology-they-trust-microsoft-expert-says",
    },
    {
      name: "How technology and economics can help save endangered species",
      url: "https://news.osu.edu/how-technology-and-economics-can-help-save-endangered-species/",
    },
    {
      name: "How technology can help save Indigenous forests – and our planet",
      url: "https://www.eco-business.com/opinion/how-technology-can-help-save-indigenous-forests-and-our-planet/",
    },
    {
      name: "The most energy-efficient way to build homes",
      url: "https://www.technologyreview.com/2023/12/22/1084532/passive-house-energy-efficient-harold-orr/",
    },
    {
      name: "Using virtual reality to diagnose Alzheimer's disease",
      url: "https://www.bbc.com/news/technology-67794645",
    },
  ],
  "Personal Finance": [
    {
      name: "Turn your home’s empty bedroom into $875 in monthly rent",
      url: "https://www.theglobeandmail.com/investing/personal-finance/household-finances/article-turn-your-homes-empty-bedroom-into-875-in-monthly-rent/",
    },
    {
      name: "Don’t let financial constraints slow down your gift-giving",
      url: "https://www.thespec.com/life/personal-finance/don-t-let-financial-constraints-slow-down-your-gift-giving/article_e3c99ac5-912c-59a9-a815-654befcd4c9c.html",
    },
    {
      name: "The worst retirement planning mistakes you should avoid, according to an expert",
      url: "https://www.ctvnews.ca/business/the-worst-retirement-planning-mistakes-you-should-avoid-according-to-an-expert-1.6694093",
    },
    {
      name: "What to Do About That Credit-Card Debt",
      url: "https://www.thecut.com/2023/12/what-to-do-about-that-credit-card-debt.html",
    },
    {
      name: "How to become rich: Nine golden personal finance rules that may help you make money",
      url: "https://www.livemint.com/money/personal-finance/how-to-become-rich-nine-golden-personal-finance-rules-that-may-help-you-make-money-11703059139843.html",
    },
    {
      name: "Saving Money: Smart Strategies for Keeping Your Financial New Years’ Resolutions",
      url: "https://www.tipranks.com/news/personal-finance/saving-money-smart-strategies-for-keeping-your-financial-new-years-resolutions",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
  ],
  Productivity: [
    {
      name: "Efficiency Vs. Productivity At Work: How To Balance Both",
      url: "https://www.forbes.com/sites/carolinecastrillon/2023/12/20/efficiency-vs-productivity-at-work-how-to-increase-both/?sh=4c7d486f1bee",
    },
    {
      name: "Is it worth measuring software developer productivity? CIOs weigh in",
      url: "https://www.cio.com/article/1255774/is-it-worth-measuring-software-developer-productivity-cios-weigh-in.html",
    },
    {
      name: "Avoid These 10 Business Habits to Increase Workplace Productivity",
      url: "https://www.entrepreneur.com/growing-a-business/10-bad-business-habits-that-destroy-productivity/466381",
    },
    {
      name: "The value of productivity",
      url: "https://www.tribuneindia.com/news/musings/the-value-of-productivity-573858",
    },
    {
      name: "This new Canonical feature solves my biggest problem with online productivity apps",
      url: "https://www.zdnet.com/article/canonical-will-soon-make-it-even-easier-to-work-with-google-workspace-and-office-365-online/",
    },
    {
      name: "10 Practical Recommendations for Increasing Work Results and Value",
      url: "https://www.inc.com/martin-zwilling/10-practical-recommendations-for-increasing-work-results-value.html",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
  ],
  Recipes: [
    {
      name: "Joe Woodhouse’s vegetarian standouts for Christmas day – recipes",
      url: "https://www.theguardian.com/food/2023/dec/22/joe-woodhouses-vegetarian-standouts-for-christmas-day-recipes",
    },
    {
      name: "10 cookie recipes to bake for your holiday party",
      url: "https://www.deseret.com/2023/12/21/24009656/best-holiday-cookie-recipes",
    },
    {
      name: "The Best Potato Recipes for Holiday Season and Beyond, According to Eater Staff",
      url: "https://www.eater.com/24003490/the-best-potato-recipes-for-holiday-season-and-beyond-according-to-eater-staff",
    },
    {
      name: "The Most-Saved Recipes in the Epicurious App This Week",
      url: "https://www.epicurious.com/recipes-menus/most-saved-recipes",
    },
    {
      name: "11 Brand-New Recipes to Try This Month",
      url: "https://www.tasteofhome.com/collection/new-recipes-to-try/",
    },
    {
      name: "19 Baked Pasta Recipes for Golden, Gooey Comfort",
      url: "https://www.bonappetit.com/gallery/baked-pasta-recipes",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
    {
      name: "Example",
      url: "https://example.com",
    },
  ],
};
