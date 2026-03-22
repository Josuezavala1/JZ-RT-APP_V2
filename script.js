(function () {
  const USERNAME = "admin";
  const PASSWORD = "Youare#1";
  const AUTH_STORAGE_KEY = "rt-shot-safety-v2-authenticated";
  const AUTH_USER_STORAGE_KEY = "rt-shot-safety-v2-auth-user";
  const AUTH_VERSION_STORAGE_KEY = "rt-shot-safety-v2-auth-version";
  const AUTH_VERSION = "admin-youare-1";

  // Locked isotope constants in mR/hr per Ci @ 1 ft.
  const ISOTOPE_CONSTANTS = {
    IR192: 5200,
    "Co-60": 14000,
    "Se-75": 2200,
  };

  const STORAGE_KEY = "rt-shot-safety-v2-state";
  const FIGURE_CRITERIA = {
    "1": [
      "FIGURE 1 - MAX ACCURACY",
      "",
      "Exposure: Single Wall",
      "Viewing: Single Wall",
      "",
      "Pipe Condition",
      "Pipe greater than 6 inches or when best accuracy is required.",
      "",
      "Setup",
      "Aim between the pipe wall and the comparator ball.",
      "Only one wall is viewed.",
      "",
      "Limits",
      "Maximum magnification: 20 percent.",
      "",
      "Inspection Zone",
      "Within 6 inches of the comparator ball.",
      "",
      "Note",
      "If pipe is 6 inches or below, double wall exposure may be used.",
    ].join("\n"),
    "2": [
      "FIGURE 2",
      "",
      "Exposure: Double Wall",
      "Viewing: Double Wall",
      "",
      "Pipe Condition",
      "Pipe greater than 4 inches up to 6 inches.",
      "",
      "Setup",
      "Aim at the center of the pipe.",
      "Place two comparator balls, one on each side of the pipe wall.",
      "Both walls may be measured.",
      "",
      "Inspection Zone",
      "Within 6 inches of the comparator ball.",
      "",
      "Reminder",
      "If insulation is greater than 1.5 inches, use Figure 4.",
    ].join("\n"),
    "3": [
      "FIGURE 3",
      "",
      "Exposure: Double Wall",
      "Viewing: Double Wall",
      "",
      "Pipe Condition",
      "Pipe 3 inches or smaller.",
      "",
      "Setup",
      "Aim at the center of the pipe.",
      "Use one comparator ball on one wall.",
      "",
      "Inspection Rule",
      "Both walls may be measured as long as they remain within the inspection zone.",
      "",
      "Inspection Zone",
      "Within 6 inches of the comparator ball.",
      "",
      "Reminder",
      "If insulation is greater than 1.5 inches, use Figure 4.",
    ].join("\n"),
    "4": [
      "FIGURE 4",
      "",
      "Exposure: Single Wall",
      "Viewing: Single Wall",
      "",
      "Pipe Condition",
      "Pipe greater than 6 inches.",
      "",
      "Insulation Condition",
      "Used when insulation is greater than 1.5 inches.",
      "",
      "Setup",
      "Aim between the comparator ball and the insulation.",
      "Only the inspection zone on one wall is evaluated.",
      "",
      "Inspection Zone",
      "Within 6 inches of the comparator ball.",
    ].join("\n"),
    "5": [
      "FIGURE 5",
      "",
      "Exposure: Double Wall",
      "Viewing: Double Wall",
      "",
      "Pipe Condition",
      "Pipe 6 inches or smaller.",
      "",
      "Insulation Condition",
      "Used when insulation is 1.5 inches or less.",
      "",
      "Setup",
      "Aim at the center of the pipe.",
      "Both walls may be evaluated.",
      "",
      "Inspection Zone",
      "Within 6 inches of the comparator ball.",
      "",
      "Reminder",
      "If insulation is greater than 1.5 inches, use Figure 4.",
    ].join("\n"),
  };

  const FIGURE_IMAGE_MAP = {
    "1": "assets/fig1.svg",
    "2": "assets/fig2.svg",
    "3": "assets/fig3.svg",
    "4": "assets/fig4.svg",
    "5": "assets/fig5.svg",
  };

  const authDom = {
    loginShell: document.getElementById("loginShell"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    appRoot: document.getElementById("appRoot"),
    appTemplate: document.getElementById("appTemplate"),
  };

  let dom = null;
  let materialLayers = [];
  let shotCards = [];
  let appInitialized = false;

  function clearStoredAuth() {
    [sessionStorage, localStorage].forEach((storage) => {
      storage.removeItem(AUTH_STORAGE_KEY);
      storage.removeItem(AUTH_USER_STORAGE_KEY);
      storage.removeItem(AUTH_VERSION_STORAGE_KEY);
    });
  }

  function isAuthenticated() {
    const isCurrentSessionAuthenticated =
      sessionStorage.getItem(AUTH_STORAGE_KEY) === "true" &&
      sessionStorage.getItem(AUTH_USER_STORAGE_KEY) === USERNAME &&
      sessionStorage.getItem(AUTH_VERSION_STORAGE_KEY) === AUTH_VERSION;

    if (!isCurrentSessionAuthenticated) {
      clearStoredAuth();
      return false;
    }

    return true;
  }

  function showLogin() {
    if (authDom.loginShell) {
      authDom.loginShell.hidden = false;
    }
    if (authDom.appRoot) {
      authDom.appRoot.replaceChildren();
    }
  }

  function mountApp() {
    if (!authDom.appRoot || !authDom.appTemplate) {
      return;
    }

    if (!authDom.appRoot.hasChildNodes()) {
      authDom.appRoot.appendChild(authDom.appTemplate.content.cloneNode(true));
    }

    if (authDom.loginShell) {
      authDom.loginShell.remove();
      authDom.loginShell = null;
    }

    initializeApp();
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    const username = authDom.loginUsername.value;
    const password = authDom.loginPassword.value;
    const usernameMatched = username === USERNAME;
    const passwordMatched = password === PASSWORD;
    const isValidLogin = usernameMatched && passwordMatched;

    console.log("[login-debug] entered username:", username);
    console.log("[login-debug] username matched:", usernameMatched);
    console.log("[login-debug] password matched:", passwordMatched);

    if (!isValidLogin) {
      authDom.loginError.textContent = "Invalid login";
      clearStoredAuth();
      showLogin();
      return;
    }

    clearStoredAuth();
    sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
    sessionStorage.setItem(AUTH_USER_STORAGE_KEY, USERNAME);
    sessionStorage.setItem(AUTH_VERSION_STORAGE_KEY, AUTH_VERSION);
    authDom.loginError.textContent = "";
    authDom.loginForm.reset();
    mountApp();
  }

  function initializeApp() {
    if (appInitialized) {
      return;
    }

    dom = {
      appShell: document.getElementById("appShell"),
      appFooter: document.getElementById("appFooter"),
      unitSite: document.getElementById("unitSite"),
      jobDate: document.getElementById("jobDate"),
      drawingNumber: document.getElementById("drawingNumber"),
      technician: document.getElementById("technician"),
      cameraSerial: document.getElementById("cameraSerial"),
      isotope: document.getElementById("isotope"),
      isotopeConstant: document.getElementById("isotopeConstant"),
      focusSpot: document.getElementById("focusSpot"),
      sourceActivity: document.getElementById("sourceActivity"),
      exposureTimeUnit: document.getElementById("exposureTimeUnit"),
      timePerExposure: document.getElementById("timePerExposure"),
      numberOfExposures: document.getElementById("numberOfExposures"),
      useTotalExposureMinutesOverride: document.getElementById("useTotalExposureMinutesOverride"),
      totalExposureMinutesOverrideWrapper: document.getElementById("totalExposureMinutesOverrideWrapper"),
      totalExposureMinutesOverride: document.getElementById("totalExposureMinutesOverride"),
      beamMinutesPerHour: document.getElementById("beamMinutesPerHour"),
      maxDoseAtPublic: document.getElementById("maxDoseAtPublic"),
      timeFraction: document.getElementById("timeFraction"),
      boundary2: document.getElementById("boundary2"),
      boundary100: document.getElementById("boundary100"),
      distanceNoShield: document.getElementById("distanceNoShield"),
      distanceWithShield: document.getElementById("distanceWithShield"),
      distanceEmergency: document.getElementById("distanceEmergency"),
      materials: document.getElementById("materials"),
      addMaterial: document.getElementById("addMaterial"),
      attenuationFactor: document.getElementById("attenuationFactor"),
      shots: document.getElementById("shots"),
      addShot: document.getElementById("addShot"),
      exposureDistance: document.getElementById("exposureDistance"),
      targetIntensity: document.getElementById("targetIntensity"),
      exposureTime: document.getElementById("exposureTime"),
      warningsList: document.getElementById("warningsList"),
      generatePdfButton: document.getElementById("generatePdfButton"),
    };

    // Backward-compatible aliases for legacy names used throughout this file.
    dom.layersContainer = dom.materials;
    dom.addLayerButton = dom.addMaterial;
    dom.shotCardsContainer = dom.shots;
    dom.addShotButton = dom.addShot;

    function numberValue(el) {
      const value = Number(el.value);
      return Number.isFinite(value) ? value : 0;
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function requiredMissing() {
      return !dom.unitSite.value || !dom.jobDate.value || !dom.drawingNumber.value || numberValue(dom.focusSpot) <= 0 || numberValue(dom.sourceActivity) <= 0;
    }

    function getAttenuationFactor() {
      if (!materialLayers.length) {
        return 1;
      }

      return materialLayers.reduce((factor, layer) => {
        const hvlCount = Number(layer.hvlCount) || 0;
        const layerFactor = Math.pow(0.5, hvlCount);
        return factor * layerFactor;
      }, 1);
    }

    function getTimeFraction() {
      const totalMinutes = getTotalExposureMinutes();
      return totalMinutes > 0 ? totalMinutes / 60 : 0;
    }

    function getBeamMinutesPerHour() {
      return getTotalExposureMinutes();
    }

    function getComputedExposureMinutesFromInputs() {
      const timePerExposureRaw = dom.timePerExposure.value;
      const numberOfExposuresRaw = dom.numberOfExposures.value;

      if (timePerExposureRaw === "" || numberOfExposuresRaw === "") {
        return 0;
      }

      const timePerExposure = Number(timePerExposureRaw);
      const numberOfExposures = Number(numberOfExposuresRaw);

      if (!Number.isFinite(timePerExposure) || !Number.isFinite(numberOfExposures) || timePerExposure < 0 || numberOfExposures < 0) {
        return 0;
      }

      const minutesPerExposure = dom.exposureTimeUnit.value === "seconds" ? timePerExposure / 60 : timePerExposure;
      return minutesPerExposure * numberOfExposures;
    }

    function isManualOverrideEnabled() {
      return Boolean(dom.useTotalExposureMinutesOverride && dom.useTotalExposureMinutesOverride.checked);
    }

    function getTotalExposureMinutes() {
      const overrideRaw = dom.totalExposureMinutesOverride.value;
      const overrideValue = Number(overrideRaw);

      if (isManualOverrideEnabled() && overrideRaw !== "" && Number.isFinite(overrideValue) && overrideValue >= 0) {
        return overrideValue;
      }

      return getComputedExposureMinutesFromInputs();
    }

    function getDistanceWithoutShield(limit = 2) {
      const ci = numberValue(dom.sourceActivity);
      const constant = ISOTOPE_CONSTANTS[dom.isotope.value] || 0;
      const dutyCycle = getTimeFraction();

      if (limit <= 0 || ci <= 0 || constant <= 0 || dutyCycle <= 0) {
        return 0;
      }

      return Math.sqrt((ci * constant * dutyCycle) / limit);
    }

    function getDistanceWithAllShielding(limit = 2) {
      const ci = numberValue(dom.sourceActivity);
      const constant = ISOTOPE_CONSTANTS[dom.isotope.value] || 0;
      const dutyCycle = getTimeFraction();
      const attenuation = getAttenuationFactor();

      if (limit <= 0 || ci <= 0 || constant <= 0 || dutyCycle <= 0 || attenuation <= 0) {
        return 0;
      }

      return Math.sqrt((ci * constant * attenuation * dutyCycle) / limit);
    }

    function getEmergencyDistance(limit = 2) {
      const ci = numberValue(dom.sourceActivity);
      const constant = ISOTOPE_CONSTANTS[dom.isotope.value] || 0;

      if (limit <= 0 || ci <= 0 || constant <= 0) {
        return 0;
      }

      return Math.sqrt((ci * constant) / limit);
    }

    function getBoundaryDistance(limit) {
      const ci = numberValue(dom.sourceActivity);
      const constant = ISOTOPE_CONSTANTS[dom.isotope.value] || 0;
      const timeFraction = getTimeFraction();
      const attenuation = getAttenuationFactor();

      if (limit <= 0 || ci <= 0 || constant <= 0 || timeFraction <= 0 || attenuation <= 0) {
        return 0;
      }

      return Math.sqrt((ci * constant * timeFraction * attenuation) / limit);
    }

    function getShotResult(shot) {
      const d = numberValue(dom.focusSpot);
      const pdd = Number(shot.pdd) || 0;
      const spd = Number(shot.spd) || 0;

      const requiredMultiplier = getRequiredMultiplier(d);
      const recommendedSpd = pdd > 0 && requiredMultiplier > 0 ? pdd * requiredMultiplier : 0;
      const ugAtRecommended = recommendedSpd > 0 ? (d * pdd) / recommendedSpd : 0;

      if (d <= 0 || pdd <= 0 || spd <= 0) {
        return {
          spd,
          ug: 0,
          magnification: 0,
          blowUpPercent: 0,
          requiredSpdForUg: 0,
          requiredSpdForBlowUp: 0,
          requiredSpdFinal: 0,
          requiredMultiplier,
          recommendedSpd,
          ugAtRecommended,
        };
      }

      const ug = (d * pdd) / spd;
      const magnification = (spd + pdd) / spd;
      const blowUpPercent = (pdd / spd) * 100;
      const requiredSpdForUg = (d * pdd) / 0.024;
      const requiredSpdForBlowUp = pdd / 0.2;
      const requiredSpdFinal = Math.max(requiredSpdForUg, requiredSpdForBlowUp);

      return {
        spd,
        ug,
        magnification,
        blowUpPercent,
        requiredSpdForUg,
        requiredSpdForBlowUp,
        requiredSpdFinal,
        requiredMultiplier,
        recommendedSpd,
        ugAtRecommended,
      };
    }

    function getFigureCriteria(figure) {
      return FIGURE_CRITERIA[String(figure || "").trim()] || "-";
    }

    function getFigureImage(figure) {
      return FIGURE_IMAGE_MAP[String(figure || "").trim()] || "";
    }

    function isShotIdMissing(shot) {
      return !String(shot.shotId || "").trim();
    }

    function getRequiredMultiplier(focalSpot) {
      if (focalSpot <= 0) {
        return 0;
      }

      if (focalSpot < 0.12) {
        return 6;
      }

      if (focalSpot < 0.14) {
        return 7;
      }

      return 8;
    }

    function getExposureMinutes() {
      const ci = numberValue(dom.sourceActivity);
      const constant = ISOTOPE_CONSTANTS[dom.isotope.value] || 0;
      const distance = numberValue(dom.exposureDistance);
      const attenuation = getAttenuationFactor();
      const targetIntensity = numberValue(dom.targetIntensity);

      if (ci <= 0 || constant <= 0 || distance <= 0 || attenuation <= 0 || targetIntensity <= 0) {
        return 0;
      }

      // Intensity at distance with attenuation in mR/hr.
      const intensity = (ci * constant * attenuation) / (distance * distance);
      // Time in hours needed for target intensity ratio, then convert to minutes.
      const hours = targetIntensity / intensity;
      return Math.max(hours * 60, 0);
    }

    function renderLayers() {
      dom.layersContainer.innerHTML = "";

      materialLayers.forEach((layer, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "layer-card";

        wrapper.innerHTML = `
          <div class="card-row-title">
            <span class="material-layer-title${index === 0 ? " section-header-blue-text" : ""}">Layer ${index + 1}</span>
            <button type="button" class="btn-remove" data-remove-layer="${layer.id}">Remove</button>
          </div>
          <div class="field-grid">
            <label class="ui-bold-label">Material</label>
            <select data-layer-field="material" data-layer-id="${layer.id}">
              <option value="Steel" ${layer.material === "Steel" ? "selected" : ""}>Steel</option>
              <option value="Concrete" ${layer.material === "Concrete" ? "selected" : ""}>Concrete</option>
              <option value="Lead" ${layer.material === "Lead" ? "selected" : ""}>Lead</option>
              <option value="Tungsten" ${layer.material === "Tungsten" ? "selected" : ""}>Tungsten</option>
            </select>
            <label class="ui-bold-label">Thickness (inches)</label>
            <input type="number" min="0" step="0.001" data-layer-field="thickness" data-layer-id="${layer.id}" value="${layer.thickness}" />
            <label class="ui-bold-label">HVL count</label>
            <input type="number" min="0" step="0.001" data-layer-field="hvlCount" data-layer-id="${layer.id}" value="${layer.hvlCount}" />
          </div>
        `;

        dom.layersContainer.appendChild(wrapper);
      });
    }

    function renderShots() {
      dom.shotCardsContainer.innerHTML = "";

      shotCards.forEach((shot, index) => {
        const result = getShotResult(shot);
        const wrapper = document.createElement("div");
        wrapper.className = "shot-card";

        wrapper.innerHTML = `
          <div class="card-row-title">
            <span class="shot-title">Shot ${index + 1}</span>
            <button type="button" class="btn-remove" data-remove-shot="${shot.id}">Remove</button>
          </div>
          <div class="field-grid">
            <label class="ui-bold-label">Shot ID / Location <span class="required">*</span></label>
            <div>
              <input type="text" data-shot-field="shotId" data-shot-id="${shot.id}" value="${escapeHtml(shot.shotId || "")}" />
              ${isShotIdMissing(shot) ? '<div class="field-required-inline">Required</div>' : ""}
            </div>
            <label class="ui-bold-label">Exposure Time</label>
            <input type="text" data-shot-field="exposureTime" data-shot-id="${shot.id}" value="${escapeHtml(shot.exposureTime || "")}" />
            <label class="ui-bold-label">PDD (Pipe-Detector Distance) (in)</label>
            <input type="text" inputmode="decimal" min="0" step="0.001" data-shot-field="pdd" data-shot-id="${shot.id}" value="${shot.pdd}" />
            <label class="ui-bold-label">SPD (Source-Pipe Distance) (in)</label>
            <input type="text" inputmode="decimal" min="0" step="0.001" data-shot-field="spd" data-shot-id="${shot.id}" value="${shot.spd}" />
            <label class="ui-bold-label">Comparator Serial Number / Notes</label>
            <input
              type="text"
              class="shot-notes-input"
              data-shot-field="notes"
              data-shot-id="${shot.id}"
              value="${escapeHtml(shot.notes || "")}"
              placeholder=""
            />
            <label class="section-header-blue-text">Figure</label>
            <div>
              <select data-shot-field="figure" data-shot-id="${shot.id}">
                <option value="" ${(shot.figure || "") === "" ? "selected" : ""}>Select</option>
                <option value="1" ${shot.figure === "1" ? "selected" : ""}>1</option>
                <option value="2" ${shot.figure === "2" ? "selected" : ""}>2</option>
                <option value="3" ${shot.figure === "3" ? "selected" : ""}>3</option>
                <option value="4" ${shot.figure === "4" ? "selected" : ""}>4</option>
                <option value="5" ${shot.figure === "5" ? "selected" : ""}>5</option>
              </select>
              ${shot.figure ? `<div class="field-figure-image-inline">${getFigureCriteria(shot.figure)}</div>` : ""}
            </div>
          </div>
          <div class="result-grid">
            <div class="result-item"><strong>Computed UG:</strong> ${result.ug.toFixed(4)}</div>
            <div class="result-item"><strong>Field Recommendation</strong></div>
            <div class="result-item"><strong>Required Multiplier:</strong> ${result.requiredMultiplier > 0 ? `${result.requiredMultiplier}×` : "-"}</div>
            <div class="result-item"><strong>Recommended SPD (in):</strong> ${result.recommendedSpd.toFixed(3)}</div>
            <div class="result-item"><strong>UG @ Recommended:</strong> ${result.ugAtRecommended.toFixed(4)}</div>
            ${result.ug > 0.024 ? '<div class="result-item warning-red"><strong>UG Status:</strong> FAIL — UG exceeds 0.024. Increase SPD.</div>' : '<div class="result-item warning-green"><strong>UG Status:</strong> PASS — UG is within 0.024.</div>'}
          </div>
        `;

        dom.shotCardsContainer.appendChild(wrapper);
      });
    }

    function renderWarnings() {
      const warnings = [];
      if (requiredMissing()) {
        warnings.push({ text: "Missing required inputs in Job Information or Source Information.", css: "warning-yellow" });
      }

      shotCards.forEach((shot, index) => {
        if (isShotIdMissing(shot)) {
          warnings.push({ text: `Shot ${index + 1}: Shot ID / Location is required.`, css: "warning-yellow" });
        }

        const result = getShotResult(shot);
        if (result.ug > 0.024) {
          warnings.push({ text: `Shot ${index + 1}: UG exceeds 0.024.`, css: "warning-red" });
        }
      });

      if (!warnings.length) {
        warnings.push({ text: "No active warnings.", css: "" });
      }

      dom.warningsList.innerHTML = warnings.map((warning) => `<li class="${warning.css}">${warning.text}</li>`).join("");
    }

    function saveState() {
      const state = {
        unitSite: dom.unitSite.value,
        jobDate: dom.jobDate.value,
        drawingNumber: dom.drawingNumber.value,
        technician: dom.technician.value,
        cameraSerial: dom.cameraSerial.value,
        isotope: dom.isotope.value,
        focusSpot: dom.focusSpot.value,
        sourceActivity: dom.sourceActivity.value,
        exposureTimeUnit: dom.exposureTimeUnit.value,
        timePerExposure: dom.timePerExposure.value,
        numberOfExposures: dom.numberOfExposures.value,
        useTotalExposureMinutesOverride: isManualOverrideEnabled(),
        totalExposureMinutesOverride: dom.totalExposureMinutesOverride.value,
        layers: materialLayers,
        shots: shotCards,
        exposureDistance: dom.exposureDistance.value,
        targetIntensity: dom.targetIntensity.value,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const state = JSON.parse(raw);
        dom.unitSite.value = state.unitSite || "";
        dom.jobDate.value = state.jobDate || "";
        dom.drawingNumber.value = state.drawingNumber || "";
        dom.technician.value = state.technician || state.cml || "";
        dom.cameraSerial.value = state.cameraSerial || "";
        dom.isotope.value = state.isotope || "IR192";
        dom.focusSpot.value = state.focusSpot || "";
        dom.sourceActivity.value = state.sourceActivity || "";
        dom.exposureTimeUnit.value = state.exposureTimeUnit || "minutes";
        dom.timePerExposure.value = state.timePerExposure || state.minutesPerExposure || ((Number(state.secondsPerExposure) || 0) / 60);
        dom.numberOfExposures.value = state.numberOfExposures || state.exposuresPerHour || 0;
        if (dom.useTotalExposureMinutesOverride) {
          dom.useTotalExposureMinutesOverride.checked = Boolean(state.useTotalExposureMinutesOverride);
        }
        dom.totalExposureMinutesOverride.value = state.totalExposureMinutesOverride || "";
        materialLayers = Array.isArray(state.layers) ? state.layers : [];
        shotCards = Array.isArray(state.shots)
          ? state.shots.map((shot) => ({
              ...shot,
              shotId: shot.shotId || "",
              exposureTime: shot.exposureTime || "",
              notes: shot.notes || "",
              spd: shot.spd ?? 0,
              figure: shot.figure || "",
            }))
          : [];
        dom.exposureDistance.value = state.exposureDistance || 0;
        dom.targetIntensity.value = state.targetIntensity || 2;
      } catch (_e) {
        // If stored JSON is malformed, ignore it and proceed with defaults.
      }
    }

    function updateAll() {
      const hasMissingShotId = shotCards.some((shot) => isShotIdMissing(shot));

      dom.isotopeConstant.value = ISOTOPE_CONSTANTS[dom.isotope.value];

      if (dom.totalExposureMinutesOverrideWrapper) {
        dom.totalExposureMinutesOverrideWrapper.style.display = isManualOverrideEnabled() ? "block" : "none";
      }

      const timeFraction = getTimeFraction();
      dom.beamMinutesPerHour.textContent = getBeamMinutesPerHour().toFixed(1);
      dom.timeFraction.textContent = timeFraction.toFixed(4);
      dom.maxDoseAtPublic.textContent = timeFraction > 0 ? (2 / timeFraction).toFixed(1) : "—";

      dom.attenuationFactor.textContent = getAttenuationFactor().toFixed(6);
      dom.boundary2.textContent = `${getBoundaryDistance(2).toFixed(1)} ft`;
      dom.boundary100.textContent = `${getBoundaryDistance(100).toFixed(1)} ft`;
      dom.distanceNoShield.textContent = `${getDistanceWithoutShield(2).toFixed(1)} ft`;
      dom.distanceWithShield.textContent = `${getDistanceWithAllShielding(2).toFixed(1)} ft`;
      dom.distanceEmergency.textContent = `${getEmergencyDistance(2).toFixed(1)} ft`;
      dom.exposureTime.textContent = `${getExposureMinutes().toFixed(1)} minutes`;

      renderWarnings();
      if (dom.generatePdfButton) {
        dom.generatePdfButton.disabled = hasMissingShotId;
      }
      saveState();
    }

    function addMaterialLayer() {
      materialLayers.push({
        id: crypto.randomUUID(),
        material: "Steel",
        thickness: 0,
        hvlCount: 0,
      });
      renderLayers();
      updateAll();
    }

    function addShotCard() {
      shotCards.push({
        id: crypto.randomUUID(),
        shotId: "",
        exposureTime: "",
        notes: "",
        pdd: 0,
        spd: 0,
        figure: "",
      });
      renderShots();
      updateAll();
    }

    function rerenderShotCardsPreserveFocus(activeInput) {
      const isSection5Field =
        activeInput &&
        activeInput.matches('[data-shot-field="shotId"], [data-shot-field="exposureTime"], [data-shot-field="pdd"], [data-shot-field="spd"], [data-shot-field="notes"], [data-shot-field="figure"]');

      const cursorStart = isSection5Field ? activeInput.selectionStart : null;
      const cursorEnd = isSection5Field ? activeInput.selectionEnd : null;

      const shouldRestoreFocus = isSection5Field;

      const focusState = shouldRestoreFocus
        ? {
            shotId: activeInput.getAttribute("data-shot-id"),
            shotField: activeInput.getAttribute("data-shot-field"),
            selectionStart: cursorStart,
            selectionEnd: cursorEnd,
          }
        : null;

      renderShots();

      if (!focusState || !focusState.shotId || !focusState.shotField) {
        return;
      }

      const restoredInput = dom.shotCardsContainer.querySelector(
        `[data-shot-id="${focusState.shotId}"][data-shot-field="${focusState.shotField}"]`
      );

      if (!restoredInput) {
        return;
      }

      restoredInput.focus();
      requestAnimationFrame(() => {
        if (typeof focusState.selectionStart === "number" && typeof focusState.selectionEnd === "number") {
          restoredInput.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
        }
      });
    }

    function onContainerChange(event) {
      const layerId = event.target.getAttribute("data-layer-id");
      const layerField = event.target.getAttribute("data-layer-field");
      if (layerId && layerField) {
        const layer = materialLayers.find((item) => item.id === layerId);
        if (layer) {
          layer[layerField] = event.target.value;
          updateAll();
          return;
        }
      }

      const shotId = event.target.getAttribute("data-shot-id");
      const shotField = event.target.getAttribute("data-shot-field");
      if (shotId && shotField) {
        const shot = shotCards.find((item) => item.id === shotId);
        if (shot) {
          shot[shotField] = event.target.value;
          rerenderShotCardsPreserveFocus(event.target);
          updateAll();
        }
      }
    }

    function onContainerClick(event) {
      const removeLayerId = event.target.getAttribute("data-remove-layer");
      if (removeLayerId) {
        materialLayers = materialLayers.filter((layer) => layer.id !== removeLayerId);
        renderLayers();
        updateAll();
        return;
      }

      const removeShotId = event.target.getAttribute("data-remove-shot");
      if (removeShotId) {
        shotCards = shotCards.filter((shot) => shot.id !== removeShotId);
        renderShots();
        updateAll();
      }
    }

    function generatePdf() {
      if (shotCards.some((shot) => isShotIdMissing(shot))) {
        return;
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "pt", format: "letter" });
      let y = 72;
      const pageBottom = 730;
      const marginX = 40;
      const contentWidth = 532;

      function drawPdfHeader() {
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Digital Shooter Sheet", pageWidth / 2, 30, { align: "center" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Rev.1", pageWidth / 2, 46, { align: "center" });
      }

      function drawPdfFooter(pageNumber, totalPages) {
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(110, 110, 110);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 30, { align: "center" });
        pdf.text("Powered by UWC", pageWidth / 2, pageHeight - 20, { align: "center" });
      }

      function decodeCriteriaForPdf(text) {
        return String(text || "")
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      }

      function extractFigureNoteForPdf(figure) {
        const lines = decodeCriteriaForPdf(getFigureCriteria(figure))
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        for (let index = 0; index < lines.length; index += 1) {
          if (["Note", "Reminder"].includes(lines[index])) {
            return lines[index + 1] || "";
          }
        }

        return "";
      }

      function ensureSpace(requiredHeight) {
        if (y + requiredHeight > pageBottom) {
          pdf.addPage();
          drawPdfHeader();
          y = 72;
        }
      }

      function normalizePdfRow(row) {
        if (typeof row === "string") {
          return {
            text: row,
          };
        }

        return row;
      }

      function getStyledTextWidth(text, fontStyle) {
        pdf.setFont("helvetica", fontStyle);
        return pdf.getTextWidth(text);
      }

      function wrapStyledSegments(segments, maxWidth) {
        const lines = [];
        let currentLine = [];
        let currentWidth = 0;

        function pushCurrentLine() {
          if (currentLine.length) {
            lines.push(currentLine);
            currentLine = [];
            currentWidth = 0;
          }
        }

        function pushToken(text, fontStyle) {
          const tokenWidth = getStyledTextWidth(text, fontStyle);
          if (currentWidth + tokenWidth <= maxWidth || currentWidth === 0) {
            currentLine.push({ text, fontStyle });
            currentWidth += tokenWidth;
            return;
          }

          pushCurrentLine();
          currentLine.push({ text, fontStyle });
          currentWidth = tokenWidth;
        }

        segments.forEach((segment) => {
          const words = String(segment.text || "").split(/(\s+)/).filter(Boolean);
          words.forEach((word) => {
            pushToken(word, segment.fontStyle);
          });
        });

        pushCurrentLine();

        return lines.length ? lines : [[{ text: "", fontStyle: "normal" }]];
      }

      function buildWrappedRow(row, maxWidth) {
        const normalizedRow = normalizePdfRow(row);
        if (normalizedRow.text !== undefined) {
          return wrapStyledSegments([{ text: normalizedRow.text, fontStyle: "normal" }], maxWidth);
        }

        return wrapStyledSegments(
          [
            { text: normalizedRow.label || "", fontStyle: "bold" },
            { text: normalizedRow.value || "", fontStyle: "normal" },
          ],
          maxWidth
        );
      }

      function drawWrappedLine(line, x, lineY) {
        let cursorX = x;
        line.forEach((segment) => {
          pdf.setFont("helvetica", segment.fontStyle);
          pdf.text(segment.text, cursorX, lineY);
          cursorX += pdf.getTextWidth(segment.text);
        });
      }

      function drawSection(title, rows) {
        const rowGap = 14;
        const paddingTop = 14;
        const paddingBottom = 12;
        const headerHeight = 20;
        const maxTextWidth = contentWidth - 20;
        const wrappedRows = rows.map((row) => buildWrappedRow(row, maxTextWidth));
        const textHeight = wrappedRows.reduce((height, wrappedRow) => height + wrappedRow.length * rowGap, 0);
        const sectionHeight = paddingTop + headerHeight + textHeight + paddingBottom;

        ensureSpace(sectionHeight + 12);

        pdf.setDrawColor(90, 90, 90);
        pdf.setLineWidth(1);
        pdf.roundedRect(marginX, y, contentWidth, sectionHeight, 4, 4);

        pdf.setFillColor(0, 102, 204);
        pdf.rect(marginX + 1, y + 1, contentWidth - 2, headerHeight, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, marginX + 10, y + 15);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        let rowY = y + paddingTop + headerHeight + 12;

        wrappedRows.forEach((wrappedRow) => {
          wrappedRow.forEach((line, lineIndex) => {
            drawWrappedLine(line, marginX + 10, rowY + lineIndex * rowGap);
          });
          rowY += wrappedRow.length * rowGap;
        });

        y += sectionHeight + 12;
      }

      drawPdfHeader();

      drawSection("Section 1 — Job Information", [
        { label: "Unit / Site: ", value: dom.unitSite.value || "-" },
        { label: "Date: ", value: dom.jobDate.value || "-" },
        { label: "Drawing Number: ", value: dom.drawingNumber.value || "-" },
        { label: "Technician: ", value: dom.technician.value || "-" },
        { label: "Camera Serial Number: ", value: dom.cameraSerial.value || "-" },
      ]);

      drawSection("Section 2 — Source Information", [
        { label: "Isotope: ", value: dom.isotope.value },
        { label: "Constant (mR/hr per Ci @ 1 ft): ", value: ISOTOPE_CONSTANTS[dom.isotope.value] },
        { label: "Focus Spot (d): ", value: dom.focusSpot.value || "0" },
        { label: "Source Activity (Ci): ", value: dom.sourceActivity.value || "0" },
      ]);

      drawSection("Section 3 — Boundary Distances", [
        { label: "Time Fraction: ", value: getTimeFraction().toFixed(4) },
        { label: "2 mR/hr Boundary: ", value: `${getBoundaryDistance(2).toFixed(1)} ft` },
        { label: "100 mR/hr Boundary: ", value: `${getBoundaryDistance(100).toFixed(1)} ft` },
      ]);

      const materialRows = materialLayers.length
        ? materialLayers.map(
            (layer, index) => ({
              label: `Layer ${index + 1}: `,
              value: `${layer.material}, Thickness ${layer.thickness} in, HVL ${layer.hvlCount}`,
            })
          )
        : ["No material layers entered."];
      materialRows.push({ label: "Total attenuation factor: ", value: getAttenuationFactor().toFixed(6) });
      drawSection("Section 4 — Material Layers", materialRows);

      if (shotCards.length === 0) {
        drawSection("Section 5 — Shot Cards", ["No shots entered."]);
      } else {
        shotCards.forEach((shot, index) => {
          const result = getShotResult(shot);
          const shotStatus = result.ug > 0.024 ? "FAIL" : "PASS";

          const figureNumber = String(shot.figure || "").trim() || "-";
          const figureNote = extractFigureNoteForPdf(shot.figure);
          const rows = [
            { label: "Shot number: ", value: String(index + 1) },
            { label: "Shot ID / Location: ", value: shot.shotId || "-" },
            { label: "Exposure Time: ", value: shot.exposureTime || "-" },
            { label: "Fig: ", value: figureNumber },
            { label: "PDD: ", value: `${Number(shot.pdd || 0).toFixed(3)} in` },
            { label: "SPD: ", value: `${Number(shot.spd || 0).toFixed(3)} in` },
            { label: "UG: ", value: result.ug.toFixed(4) },
            { label: "Required Multiplier: ", value: result.requiredMultiplier > 0 ? `${result.requiredMultiplier}×` : "-" },
            { label: "Recommended SPD: ", value: `${result.recommendedSpd.toFixed(3)} in` },
            { label: "PASS / FAIL: ", value: shotStatus },
          ];

          if (String(shot.notes || "").trim()) {
            rows.push({ label: "COMPARATOR SERIAL NUMBER / NOTES: ", value: shot.notes.trim() });
          }

          if (figureNote) {
            rows.push(figureNote);
          }

          drawSection(`Section 5 — Shot ${index + 1}`, rows);
        });
      }

      const totalPages = pdf.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        pdf.setPage(pageNumber);
        drawPdfFooter(pageNumber, totalPages);
      }

      pdf.save("RT_Shot_Safety_Report_v2.pdf");
    }

    loadState();

    if (materialLayers.length) {
      renderLayers();
    }
    if (shotCards.length) {
      renderShots();
    }

    if (!materialLayers.length) {
      addMaterialLayer();
    }
    if (!shotCards.length) {
      addShotCard();
    }

    [
      dom.unitSite,
      dom.jobDate,
      dom.drawingNumber,
      dom.technician,
      dom.cameraSerial,
      dom.isotope,
      dom.focusSpot,
      dom.sourceActivity,
      dom.exposureTimeUnit,
      dom.timePerExposure,
      dom.numberOfExposures,
      dom.useTotalExposureMinutesOverride,
      dom.totalExposureMinutesOverride,
      dom.exposureDistance,
      dom.targetIntensity,
    ].forEach((element) => {
      element.addEventListener("input", updateAll);
      element.addEventListener("change", updateAll);
    });

    if (dom.addMaterial) {
      dom.addMaterial.addEventListener("click", addMaterialLayer);
    }
    if (dom.addShot) {
      dom.addShot.addEventListener("click", addShotCard);
    }
    if (dom.layersContainer) {
      dom.layersContainer.addEventListener("input", onContainerChange);
      dom.layersContainer.addEventListener("change", onContainerChange);
      dom.layersContainer.addEventListener("click", onContainerClick);
    }
    if (dom.shotCardsContainer) {
      dom.shotCardsContainer.addEventListener("input", onContainerChange);
      dom.shotCardsContainer.addEventListener("change", onContainerChange);
      dom.shotCardsContainer.addEventListener("click", onContainerClick);
    }
    if (dom.generatePdfButton) {
      dom.generatePdfButton.addEventListener("click", generatePdf);
    }

    updateAll();
    appInitialized = true;
  }

  if (authDom.loginForm) {
    authDom.loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (isAuthenticated()) {
    mountApp();
  } else {
    showLogin();
  }
})();
