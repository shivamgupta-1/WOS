import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Menu } from "./Menu";
import { Switch } from "./Switch";
import { Table } from "./Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

describe("shared UI components", () => {
  it("disables a loading button and exposes its busy state", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("updates switch state through its controlled callback", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} label="Maintenance mode" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole("switch", { name: "Maintenance mode" });

    await userEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("supports arrow-key navigation between tabs", async () => {
    render(
      <Tabs defaultValue="overview" label="Application details">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="history">History panel</TabsContent>
      </Tabs>,
    );
    const overviewTab = screen.getByRole("tab", { name: "Overview" });
    overviewTab.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("History panel")).toBeVisible();
  });

  it("closes a menu with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    render(
      <Menu
        label="Account actions"
        trigger="Account"
        items={[{ id: "settings", label: "Settings", onSelect: vi.fn() }]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Account actions" });

    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("sorts table rows and announces the active sort direction", async () => {
    const user = userEvent.setup();
    render(
      <Table
        caption="Applications"
        columns={[{
          id: "name",
          header: "Name",
          sortLabel: "name",
          sortValue: (row: { name: string }) => row.name,
          cell: (row: { name: string }) => row.name,
        }]}
        rows={[{ name: "Zeta" }, { name: "Alpha" }]}
        getRowKey={(row) => row.name}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sort by name" }));
    const rows = screen.getAllByRole("row");
    const cells = rows.slice(1).map((row) => within(row).getByRole("cell").textContent);

    expect(cells).toEqual(["Alpha", "Zeta"]);
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute("aria-sort", "ascending");
  });
});
