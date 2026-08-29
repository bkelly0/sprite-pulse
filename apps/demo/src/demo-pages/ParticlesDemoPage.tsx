import { ParticlesDemoComponent } from "../components/ParticlesDemoComponent";

export function ParticlesDemoPage() {
  
  return (
    <>
    <h1>Particles Demo</h1>
    <ParticlesDemoComponent />
    <section>
        <h2>Overview</h2>
        <p>
          This is a stress-style particle renderer. The intensity slider changes how many particles are spawned per frame,
          so the scene can scale from a light effect to thousands of active
          sprites. This is to demonstrate drawing many
          sprites continuously in real time.
        </p>
        <h3>High Sprite Throughput and Efficiency</h3>
        <ul>
          <li>
            New particles are created every frame.
          </li>
          <li>
            Existing particles are updated every frame with physics-like motion.
          </li>
          <li>
            The full active sprite list is re-rendered each frame.
          </li>
          <li>
            It uses WebGL2 so drawing work is handled by the GPU.
          </li>
          <li>
            It reuses shared geometry and shader programs rather than rebuilding
            render data each frame.
          </li>
          <li>
            It packs source images into cached atlas textures to reduce
            texture-switch overhead.
          </li>
          <li>
            It performs viewport culling so off-screen sprites are skipped.
          </li>
          <li>
            It keeps GPU resources alive across frames, minimizing runtime
            allocation and setup cost.
          </li>
        </ul>
      </section>
    </>
  );
}
