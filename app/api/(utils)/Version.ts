export default class Version {
  major: number;
  minor: number;
  patch: number;

  constructor(major: number, minor: number, patch: number) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  static isValid(text: string): boolean {
    return Version.parse(text) !== undefined;
  }

  static parse(text: string): Version | undefined {
    const parts = text.split(".");
    if (parts.length !== 3) return undefined;

    const major = Number.parseInt(parts[0]);
    const minor = Number.parseInt(parts[1]);
    const patch = Number.parseInt(parts[2]);
    if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) return undefined;

    return new Version(major, minor, patch);
  }

  static parseOrThrow(text: string): Version {
    const result = Version.parse(text);
    if (!result) throw new Error(`Invalid version string: ${text}`);
    return result;
  }

  compare(other: Version): number {
    if (this.major !== other.major) return other.major - this.major;
    if (this.minor !== other.minor) return other.minor - this.minor;
    return other.patch - this.patch;
  }

  static compareAll(pairs: [Version, Version][]): number {
    for (const [v1, v2] of pairs) {
      const comparison = v1.compare(v2);
      if (comparison !== 0) return comparison;
    }
    return 0;
  }
}
