import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as notificationModule from "./_core/notification";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Notifications pour Feedbacks Négatifs", () => {
  let notifyOwnerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Espionner la fonction notifyOwner
    notifyOwnerSpy = vi.spyOn(notificationModule, "notifyOwner");
    notifyOwnerSpy.mockResolvedValue(true);
  });

  describe("Soumission de feedback négatif", () => {
    it("devrait envoyer une notification pour un score de 0 (détracteur)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 0,
        comment: "Service très mauvais",
      });

      // Vérifier que notifyOwner a été appelé
      expect(notifyOwnerSpy).toHaveBeenCalledTimes(1);
      
      // Vérifier le contenu de la notification
      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.title).toContain("Feedback négatif");
      expect(callArgs.content).toContain("**Score NPS:** 0/10");
      expect(callArgs.content).toContain("Service très mauvais");
    });

    it("devrait envoyer une notification pour un score de 6 (détracteur)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 6,
        comment: "Pas satisfait",
      });

      expect(notifyOwnerSpy).toHaveBeenCalledTimes(1);
      
      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.content).toContain("**Score NPS:** 6/10");
    });

    it("devrait envoyer une notification même sans commentaire", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 3,
      });

      expect(notifyOwnerSpy).toHaveBeenCalledTimes(1);
      
      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.content).toContain("Aucun commentaire fourni");
    });
  });

  describe("Soumission de feedback passif ou positif", () => {
    it("ne devrait PAS envoyer de notification pour un score de 7 (passif)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 7,
        comment: "Correct",
      });

      expect(notifyOwnerSpy).not.toHaveBeenCalled();
    });

    it("ne devrait PAS envoyer de notification pour un score de 8 (passif)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 8,
      });

      expect(notifyOwnerSpy).not.toHaveBeenCalled();
    });

    it("ne devrait PAS envoyer de notification pour un score de 9 (promoteur)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 9,
        comment: "Très bien !",
      });

      expect(notifyOwnerSpy).not.toHaveBeenCalled();
    });

    it("ne devrait PAS envoyer de notification pour un score de 10 (promoteur)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 10,
        comment: "Excellent !",
      });

      expect(notifyOwnerSpy).not.toHaveBeenCalled();
    });
  });

  describe("Contenu de la notification", () => {
    it("devrait inclure le nom du magasin dans le titre", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 2,
      });

      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.title).toContain("Marjane Bouregreg");
    });

    it("devrait inclure la ville du magasin dans le contenu", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 1,
      });

      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.content).toContain("Rabat");
    });

    it("devrait inclure le commentaire s'il est fourni", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const testComment = "Le personnel n'était pas aimable";

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 4,
        comment: testComment,
      });

      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.content).toContain(testComment);
    });

    it("devrait mentionner l'absence de commentaire si non fourni", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await caller.kpis.submitNPS({
        storeId: 150001,
        score: 5,
      });

      const callArgs = notifyOwnerSpy.mock.calls[0][0];
      expect(callArgs.content).toContain("Aucun commentaire fourni");
    });
  });

  describe("Gestion des erreurs", () => {
    it("ne devrait pas bloquer la soumission si la notification échoue", async () => {
      // Simuler un échec de notification
      notifyOwnerSpy.mockResolvedValue(false);

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // La soumission devrait réussir malgré l'échec de notification
      const result = await caller.kpis.submitNPS({
        storeId: 150001,
        score: 3,
        comment: "Pas content",
      });

      expect(result).toBeDefined();
      expect(notifyOwnerSpy).toHaveBeenCalledTimes(1);
    });

    it("ne devrait pas bloquer la soumission si notifyOwner lance une exception", async () => {
      // Simuler une exception
      notifyOwnerSpy.mockRejectedValue(new Error("Network error"));

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // La soumission devrait réussir malgré l'exception
      const result = await caller.kpis.submitNPS({
        storeId: 150001,
        score: 2,
      });

      expect(result).toBeDefined();
    });
  });

  describe("Seuil de déclenchement", () => {
    it("devrait envoyer une notification pour tous les scores de 0 à 6", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Tester tous les scores de 0 à 6
      for (let score = 0; score <= 6; score++) {
        notifyOwnerSpy.mockClear();

        await caller.kpis.submitNPS({
          storeId: 150001,
          score,
        });

        expect(notifyOwnerSpy).toHaveBeenCalledTimes(1);
      }
    });

    it("ne devrait PAS envoyer de notification pour les scores de 7 à 10", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Tester tous les scores de 7 à 10
      for (let score = 7; score <= 10; score++) {
        notifyOwnerSpy.mockClear();

        await caller.kpis.submitNPS({
          storeId: 150001,
          score,
        });

        expect(notifyOwnerSpy).not.toHaveBeenCalled();
      }
    });
  });
});
