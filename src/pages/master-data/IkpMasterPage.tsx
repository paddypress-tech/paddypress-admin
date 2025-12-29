import * as React from "react";
import { useSearchParams } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import IkpStatesPage from "@/pages/master-data/IkpStatesPage";
import IkpDistrictsPage from "@/pages/master-data/IkpDistrictsPage";
import IkpMandalsPage from "@/pages/master-data/IkpMandalsPage";
import IkpVillagesPage from "@/pages/master-data/IkpVillagesPage";

const allowedTabs = ["states", "districts", "mandals", "villages"] as const;

type TabValue = (typeof allowedTabs)[number];

function normalizeTab(value: string | null): TabValue {
  if (!value) return "states";
  const v = value.trim().toLowerCase();
  return (allowedTabs as readonly string[]).includes(v) ? (v as TabValue) : "states";
}

export default function IkpMasterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = React.useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        const nextTab = normalizeTab(next);
        const sp = new URLSearchParams(searchParams);
        sp.set("tab", nextTab);
        setSearchParams(sp, { replace: true });
      }}
    >
      <TabsList>
        <TabsTrigger value="states">States</TabsTrigger>
        <TabsTrigger value="districts">Districts</TabsTrigger>
        <TabsTrigger value="mandals">Mandals</TabsTrigger>
        <TabsTrigger value="villages">Villages</TabsTrigger>
      </TabsList>

      <TabsContent value="states">
        <IkpStatesPage />
      </TabsContent>
      <TabsContent value="districts">
        <IkpDistrictsPage />
      </TabsContent>
      <TabsContent value="mandals">
        <IkpMandalsPage />
      </TabsContent>
      <TabsContent value="villages">
        <IkpVillagesPage />
      </TabsContent>
    </Tabs>
  );
}
