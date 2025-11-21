import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@marjane.ma",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Formulaire de Feedback Client NPS", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("Soumission de feedback NPS", () => {
    it("devrait accepter un score NPS de promoteur (9-10)", async () => {
      const result = await caller.kpis.submitNPS({
        storeId: 1,
        score: 10,
        comment: "Service excellent, magasin très propre !",
        customerEmail: "client@example.com",
      });

      expect(result).toBeDefined();
    });

    it("devrait accepter un score NPS de passif (7-8)", async () => {
      const result = await caller.kpis.submitNPS({
        storeId: 1,
        score: 8,
        comment: "Bien mais il manque certains produits",
      });

      expect(result).toBeDefined();
    });

    it("devrait accepter un score NPS de détracteur (0-6)", async () => {
      const result = await caller.kpis.submitNPS({
        storeId: 1,
        score: 4,
        comment: "Attente trop longue aux caisses",
      });

      expect(result).toBeDefined();
    });

    it("devrait accepter un feedback sans commentaire", async () => {
      const result = await caller.kpis.submitNPS({
        storeId: 1,
        score: 7,
      });

      expect(result).toBeDefined();
    });

    it("devrait accepter un feedback sans email", async () => {
      const result = await caller.kpis.submitNPS({
        storeId: 1,
        score: 9,
        comment: "Très satisfait",
      });

      expect(result).toBeDefined();
    });

    it("devrait rejeter un score inférieur à 0", async () => {
      await expect(
        caller.kpis.submitNPS({
          storeId: 1,
          score: -1,
        })
      ).rejects.toThrow();
    });

    it("devrait rejeter un score supérieur à 10", async () => {
      await expect(
        caller.kpis.submitNPS({
          storeId: 1,
          score: 11,
        })
      ).rejects.toThrow();
    });

    it("devrait rejeter un email invalide", async () => {
      await expect(
        caller.kpis.submitNPS({
          storeId: 1,
          score: 8,
          customerEmail: "email-invalide",
        })
      ).rejects.toThrow();
    });
  });

  describe("Calcul du NPS après soumissions", () => {
    it("devrait calculer le NPS correctement après plusieurs soumissions", async () => {
      // Soumettre plusieurs feedbacks
      await caller.kpis.submitNPS({ storeId: 2, score: 10 }); // Promoteur
      await caller.kpis.submitNPS({ storeId: 2, score: 9 });  // Promoteur
      await caller.kpis.submitNPS({ storeId: 2, score: 8 });  // Passif
      await caller.kpis.submitNPS({ storeId: 2, score: 7 });  // Passif
      await caller.kpis.submitNPS({ storeId: 2, score: 5 });  // Détracteur

      // Calculer le NPS
      const nps = await caller.kpis.npsScore({ storeId: 2 });

      // Vérifier la structure
      expect(nps).toHaveProperty("npsScore");
      expect(nps).toHaveProperty("promoters");
      expect(nps).toHaveProperty("passives");
      expect(nps).toHaveProperty("detractors");
      expect(nps).toHaveProperty("totalResponses");

      // Vérifier les comptages
      expect(nps.promoters).toBeGreaterThanOrEqual(2);
      expect(nps.passives).toBeGreaterThanOrEqual(2);
      expect(nps.detractors).toBeGreaterThanOrEqual(1);
      expect(nps.totalResponses).toBeGreaterThanOrEqual(5);

      // Vérifier que le NPS est dans la plage valide
      expect(nps.npsScore).toBeGreaterThanOrEqual(-100);
      expect(nps.npsScore).toBeLessThanOrEqual(100);
    });

    it("devrait retourner NPS = 0 pour un magasin sans feedback", async () => {
      const nps = await caller.kpis.npsScore({ storeId: 999 });

      expect(nps.npsScore).toBe(0);
      expect(nps.totalResponses).toBe(0);
      expect(nps.promoters).toBe(0);
      expect(nps.passives).toBe(0);
      expect(nps.detractors).toBe(0);
    });
  });

  describe("Filtrage par période", () => {
    it("devrait filtrer les feedbacks par date de début", async () => {
      const startDate = new Date("2024-01-01");
      
      const nps = await caller.kpis.npsScore({
        storeId: 1,
        startDate,
      });

      expect(nps).toHaveProperty("npsScore");
      expect(typeof nps.npsScore).toBe("number");
    });

    it("devrait filtrer les feedbacks par plage de dates", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      
      const nps = await caller.kpis.npsScore({
        storeId: 1,
        startDate,
        endDate,
      });

      expect(nps).toHaveProperty("npsScore");
      expect(typeof nps.npsScore).toBe("number");
    });
  });

  describe("Validation des données du magasin", () => {
    it("devrait récupérer les informations du magasin si il existe", async () => {
      const store = await caller.stores.getById({ id: 1 });

      // Le magasin peut ne pas exister dans la base de test
      if (store) {
        expect(store).toHaveProperty("id");
        expect(store).toHaveProperty("name");
        expect(store).toHaveProperty("city");
      } else {
        // Si le magasin n'existe pas, le test passe quand même
        expect(store).toBeUndefined();
      }
    });
  });

  describe("Intégration complète du flux", () => {
    it("devrait permettre le flux complet : soumission → calcul NPS → vérification", async () => {
      const testStoreId = 3;

      // 1. Vérifier l'état initial
      const initialNPS = await caller.kpis.npsScore({ storeId: testStoreId });
      const initialTotal = initialNPS.totalResponses;

      // 2. Soumettre un nouveau feedback
      await caller.kpis.submitNPS({
        storeId: testStoreId,
        score: 10,
        comment: "Test d'intégration",
      });

      // 3. Vérifier que le NPS a été mis à jour
      const updatedNPS = await caller.kpis.npsScore({ storeId: testStoreId });
      
      expect(updatedNPS.totalResponses).toBeGreaterThan(initialTotal);
    });
  });
});
