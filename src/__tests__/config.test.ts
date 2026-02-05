import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {getApiUrl, EXIT_CODES} from "../lib/config.js";

describe("config utilities", () => {
  describe("getApiUrl", () => {
    it("should return custom URL when apiUrl option is provided", () => {
      const customUrl = "https://custom-api.example.com";
      expect(getApiUrl({apiUrl: customUrl})).toBe(customUrl);
    });

    it("should return dev URL when env is dev", () => {
      expect(getApiUrl({env: "dev"})).toBe("https://dev-api.sequence.build");
    });

    it("should return prod URL when env is prod", () => {
      expect(getApiUrl({env: "prod"})).toBe("https://api.sequence.build");
    });

    it("should return prod URL by default", () => {
      expect(getApiUrl()).toBe("https://api.sequence.build");
    });

    it("should prioritize apiUrl over env option", () => {
      const customUrl = "https://custom-api.example.com";
      expect(getApiUrl({apiUrl: customUrl, env: "dev"})).toBe(customUrl);
    });
  });

  describe("EXIT_CODES", () => {
    it("should have SUCCESS as 0", () => {
      expect(EXIT_CODES.SUCCESS).toBe(0);
    });

    it("should have GENERAL_ERROR as 1", () => {
      expect(EXIT_CODES.GENERAL_ERROR).toBe(1);
    });

    it("should have NOT_LOGGED_IN as 10", () => {
      expect(EXIT_CODES.NOT_LOGGED_IN).toBe(10);
    });

    it("should have INVALID_PRIVATE_KEY as 11", () => {
      expect(EXIT_CODES.INVALID_PRIVATE_KEY).toBe(11);
    });

    it("should have INSUFFICIENT_FUNDS as 20", () => {
      expect(EXIT_CODES.INSUFFICIENT_FUNDS).toBe(20);
    });

    it("should have NO_PROJECTS_FOUND as 30", () => {
      expect(EXIT_CODES.NO_PROJECTS_FOUND).toBe(30);
    });

    it("should have PROJECT_NOT_FOUND as 31", () => {
      expect(EXIT_CODES.PROJECT_NOT_FOUND).toBe(31);
    });

    it("should have API_ERROR as 40", () => {
      expect(EXIT_CODES.API_ERROR).toBe(40);
    });
  });
});
