export type TimestampedState<TState> = {
  receivedAt: number;
  state: TState;
};

export type InterpolationPair<TState> = {
  previous: TimestampedState<TState>;
  current: TimestampedState<TState>;
};

//keeps the last two received states so callers can interpolate between them
export class StateBuffer<TState> {
  private entries: TimestampedState<TState>[] = [];

  push(state: TState, receivedAt: number): void {
    this.entries = [...this.entries, { receivedAt, state }].slice(-2);
  }

  getInterpolationPair(): InterpolationPair<TState> | null {
    if (this.entries.length < 2) {
      return null;
    }

    return { previous: this.entries[0], current: this.entries[1] };
  }

  clear(): void {
    this.entries = [];
  }
}
