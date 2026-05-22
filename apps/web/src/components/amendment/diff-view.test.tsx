import { render, screen, fireEvent } from "@testing-library/react";
import { DiffView } from "./diff-view";

describe("DiffView", () => {
  const originalContent = "这是原始内容的第一段\n\n这是原始内容的第二段";
  const amendedContent = "这是原始内容的第一段\n\n这是修改后的第二段";

  it("should render with original view as default", () => {
    render(<DiffView originalContent={originalContent} amendedContent={amendedContent} />);

    expect(screen.getByText("原始内容")).toBeInTheDocument();
    expect(screen.getByText("差异对比")).toBeInTheDocument();
    expect(screen.getByText("合并结果")).toBeInTheDocument();

    expect(screen.getByText("这是原始内容的第一段")).toBeInTheDocument();
  });

  it("should switch between view modes", () => {
    render(<DiffView originalContent={originalContent} amendedContent={amendedContent} />);

    fireEvent.click(screen.getByText("差异对比"));

    expect(screen.getByText("原始")).toBeInTheDocument();
    expect(screen.getByText("最新版本")).toBeInTheDocument();
  });

  it("should render single paragraph content", () => {
    render(<DiffView originalContent="单段落内容" amendedContent="修改后的单段落内容" />);

    expect(screen.getByText("单段落内容")).toBeInTheDocument();
  });

  it("should show changed markers in diff view", () => {
    render(<DiffView originalContent={originalContent} amendedContent={amendedContent} />);

    fireEvent.click(screen.getByText("差异对比"));

    expect(screen.getByText("已修改")).toBeInTheDocument();
    expect(screen.getByText("这是修改后的第二段")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DiffView
        originalContent="test"
        amendedContent="test2"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});