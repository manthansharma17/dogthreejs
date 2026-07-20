import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const Dog = () => {
  const model = useGLTF("/models/dog.drc.glb");

  const { camera, gl } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 0.55);

    gl.toneMapping = THREE.ReinhardToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [camera, gl]);

  const { actions } = useAnimations(model.animations, model.scene);

  useEffect(() => {
    const action = actions?.["Take 001"];

    if (action) {
      action.reset().fadeIn(0.3).play();
    }

    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions]);

  const [normalMap] = useTexture(["/dog_normals.jpg"]).map((texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });

  const [branchMap, branchNormalMap] = useTexture([
    "/branches_diffuse.jpeg",
    "branches_normals.jpeg",
  ]).map((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });

  const [
    mat1,
    mat2,
    mat3,
    mat4,
    mat5,
    mat6,
    mat7,
    mat8,
    mat9,
    mat10,
    mat11,
    mat12,
    mat13,
    mat14,
    mat15,
    mat16,
    mat17,
    mat18,
    mat19,
    mat20,
  ] = useTexture([
    "/matcap/mat-1.png",
    "/matcap/mat-2.png",
    "/matcap/mat-3.png",
    "/matcap/mat-4.png",
    "/matcap/mat-5.png",
    "/matcap/mat-6.png",
    "/matcap/mat-7.png",
    "/matcap/mat-8.png",
    "/matcap/mat-9.png",
    "/matcap/mat-10.png",
    "/matcap/mat-11.png",
    "/matcap/mat-12.png",
    "/matcap/mat-13.png",
    "/matcap/mat-14.png",
    "/matcap/mat-15.png",
    "/matcap/mat-16.png",
    "/matcap/mat-17.png",
    "/matcap/mat-18.png",
    "/matcap/mat-19.png",
    "/matcap/mat-20.png",
  ]).map((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });

  const material = useRef({
    uMatcap1: { value: mat19 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 1.0 },
  });

  const dogMaterial = useMemo(() => {
    const material = new THREE.MeshMatcapMaterial({
      normalMap,
      matcap: mat2,
    });

    material.onBeforeCompile = onBeforeCompile;

    return material;
  }, [normalMap, mat2]);

  const branchMaterial = useMemo(() => {
    return new THREE.MeshMatcapMaterial({
      normalMap: branchNormalMap,
      map: branchMap,
    });
  }, [branchNormalMap, branchMap]);

  const onBeforeCompile = useCallback((shader) => {
 shader.uniforms.uMatcapTexture1 = material.current.uMatcap1;
    shader.uniforms.uMatcapTexture2 = material.current.uMatcap2;
    shader.uniforms.uProgress = material.current.uProgress;

    // Store reference to shader uniforms for GSAP animation

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
        uniform sampler2D uMatcapTexture1;
        uniform sampler2D uMatcapTexture2;
        uniform float uProgress;

        void main() {
        `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
          vec4 matcapColor1 = texture2D( uMatcapTexture1, uv );
          vec4 matcapColor2 = texture2D( uMatcapTexture2, uv );
          float transitionFactor  = 0.2;
          
          float progress = smoothstep(uProgress - transitionFactor,uProgress, (vViewPosition.x+vViewPosition.y)*0.5 + 0.5);

          vec4 matcapColor = mix(matcapColor2, matcapColor1, progress );
        `,
    );
  }, []);

  useEffect(() => {
    model.scene.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name.includes("DOG")) {
        child.material = dogMaterial;
      } else {
        child.material = branchMaterial;
      }
    });

    return () => {
      dogMaterial.dispose();
      branchMaterial.dispose();
    };
  }, [model, dogMaterial, branchMaterial]);

  const dogModel = useRef();

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: "#section-3",
        start: "top top",
        end: "bottom bottom",
        markers: true,
        scrub: true,
      },
    });

    tl.to(dogModel.current.position, {
      z: "-=0.75",
      y: "+=0.1",
    })
      .to(dogModel.current.rotation, {
        x: `+=${Math.PI / 15}`,
      })
      .to(
        dogModel.current.rotation,
        {
          y: `-=${Math.PI}`,
        },
        "third",
      )
      .to(
        dogModel.current.position,
        {
          x: "-=0.5",
          z: "+=0.6",
          y: "-=0.05",
        },
        "third",
      );
  }, []);

  const animateMatcap = (texture) => {
    material.current.uMatcap1.value = texture;

    gsap.to(material.current.uProgress, {
      value: 0,
      duration: 0.3,
      onComplete: () => {
        material.current.uMatcap2.value = texture;
        material.current.uProgress.value = 1;
      },
    });
  };

  useEffect(() => {
    const titleMap = {
      tomorrowland: mat19,
      "navy-pier": mat8,
      "msi-chicago": mat9,
      phone: mat12,
      kikk: mat10,
      kennedy: mat8,
      opera: mat13,
    };

    const cleanups = [];

    Object.entries(titleMap).forEach(([name, texture]) => {
      const el = document.querySelector(`.title[img-title="${name}"]`);
      if (!el) return;

      const handler = () => animateMatcap(texture);
      el.addEventListener("mouseenter", handler);

      cleanups.push(() => el.removeEventListener("mouseenter", handler));
    });

    const titles = document.querySelector(".titles");

    if (titles) {
      const leaveHandler = () => animateMatcap(mat2);

      titles.addEventListener("mouseleave", leaveHandler);

      cleanups.push(() =>
        titles.removeEventListener("mouseleave", leaveHandler),
      );
    }

    return () => cleanups.forEach((fn) => fn());
  }, [mat2, mat8, mat9, mat10, mat12, mat13, mat19]);

  return (
    <>
      <primitive
        ref={dogModel}
        object={model.scene}
        position={[0.25, -0.55, 0]}
        rotation={[0, Math.PI / 3.9, 0]}
      />
      <directionalLight position={[0, 5, 5]} color={0xffffff} intensity={10} />
    </>
  );
};

export default Dog;
