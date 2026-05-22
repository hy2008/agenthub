import { render, screen, fireEvent } from "@testing-library/react";
import { AmendmentCard } from "./amendment-card";

const mockProposer = {
  displayName: "CodeReviewBot",
  userType: "agent" as const,
};

describe("AmendmentCard", () => {
  it("should render amendment id", () => {
    render(
      <AmendmentCard
        id={42}
        proposer={mockProposer}
        reason="修复安全漏洞"
        changes={[{ type: "add", content: "新增超时处理逻辑" }]}
        status="pending"
      />
    );
    expect(screen.getByText("修正案 #42")).toBeInTheDocument();
  });

  it("should render reason", () => {
    render(
      <AmendmentCard
        id={1}
        proposer={mockProposer}
        reason="修复安全漏洞"
        changes={[{ type: "add", content: "新增超时处理逻辑" }]}
        status="pending"
      />
    );
    expect(screen.getByText("修复安全漏洞")).toBeInTheDocument();
  });

  it("should render add change type", () => {
    render(
      <AmendmentCard
        id={1}
        proposer={mockProposer}
        reason="测试"
        changes={[{ type: "add", content: "新增内容" }]}
        status="pending"
      />
    );
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("新增内容")).toBeInTheDocument();
  });

  it("should render modify change type with original", () => {
    render(
      <AmendmentCard
        id={1}
        proposer={mockProposer}
        reason="测试"
        changes={[{ type: "modify", content: "修改后", original: "原始内容" }]}
        status="pending"
      />
    );
    expect(screen.getByText("~")).toBeInTheDocument();
    expect(screen.getByText("原始内容")).toBeInTheDocument();
    expect(screen.getByText("修改后")).toBeInTheDocument();
  });

  it("should render action buttons when status is pending", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const onRevise = vi.fn();

    render(
      <AmendmentCard
        id={1}
        proposer={mockProposer}
        reason="测试"
        changes={[{ type: "add", content: "test" }]}
        status="pending"
        onAccept={onAccept}
        onReject={onReject}
        onRevise={onRevise}
      />
    );

    expect(screen.getByText("接受")).toBeInTheDocument();
    expect(screen.getByText("撤回")).toBeInTheDocument();

    fireEvent.click(screen.getByText("接受"));
    expect(onAccept).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("撤回"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("should not render action buttons when status is not pending", () => {
    render(
      <AmendmentCard
        id={1}
        proposer={mockProposer}
        reason="测试"
        changes={[{ type: "add", content: "test" }]}
        status="accepted"
      />
    );

    expect(screen.queryByText("接受")).not.toBeInTheDocument();
    expect(screen.queryByText("撤回")).not.toBeInTheDocument();
  });

  it("should render paragraph index when provided", () => {
    render(
      <AmendmentCard
        id={1}
        proposer={mockProposer}
        reason="测试"
        changes={[{ type: "add", content: "test" }]}
        status="pending"
        paragraphIndex={3}
      />
    );
    expect(screen.getByText("段落 3")).toBeInTheDocument();
  });
});