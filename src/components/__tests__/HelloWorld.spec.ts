import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import HelloWorld from "../HelloWorld.vue";

describe("HelloWorld", () => {
  it("renders properly", () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: "Piano Note Accuracy Exercises" },
    });
    expect(wrapper.text()).toContain("Piano Note Accuracy Exercises");
  });
});
